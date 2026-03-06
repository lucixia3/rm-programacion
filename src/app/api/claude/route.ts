/**
 * Edge Function — Proxy hacia la API de Anthropic (Claude).
 * La ANTHROPIC_API_KEY vive solo aquí, en el servidor.
 */
export const runtime = "edge";

import { type NextRequest, NextResponse } from "next/server";
import { AnalyzeRequestSchema, ClaudeResultSchema } from "@/schemas/rm.schema";
import { validateBody } from "@/lib/validate";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { getServerEnv } from "@/lib/env";
import { EXCEL, buildPromptTable } from "@/data/excel";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

function isCartCase(text: string): boolean {
  const normalized = text.toLowerCase();
  return /\bcar(?:[\s\-\/]*t)\b/.test(normalized) || normalized.includes("cart");
}

function buildPrompt(text: string): string {
  return `Ets un assistent de programació de RM en un hospital espanyol. Entens abreviatures mèdiques en castellà i català.

=== ABREVIATURES RADIOLÒGIQUES ===
- ST / ESTANDAR / STANDARD = protocol estàndard, sense contrast llevat que posi +C
- +C / CTE / CONTRASTE / ELUCIREM = amb contrast IV
- TOF / TOF3D / ANGIO-RM / ARM = angiografia RM sense contrast, sense bomba
- PERFU / PERFUSION = perfusió cerebral, SEMPRE amb contrast I amb bomba
- DIFU / DIFUSION / DWI = difusió, SEMPRE amb contrast i amb bomba
- SPECTRO / ESPECTROSCOPIA = espectroscopia, amb contrast
- FLAIR / SWI / SWAN / STIR / T1 / T2 = tipus de seqüència, no impliquen contrast
- ARTRO / ARTROGRAFIA = artro-RM, sense contrast IV (intraarticular)
- mpMRI / MULTIPARAMETRICA = multiparamètrica, sempre amb contrast (pròstata, mama)
- CAIS / CAIs / PENYAL = base de crani / peñascos (oïda interna)
- TSA = troncos supraorticos (angio cervical)
- DVP = derivació ventriculoperitoneal
- ATM = articulació temporomandibular
- EM / ESCLEROSI MULTIPLE = esclerosi múltiple
- AVC / ICTUS / AIT / STROKE = ictus isquèmic
- EII / CROHN / ENTERO = malaltia inflamatòria intestinal, Entero-RM
- NEO / CA / K / TUMOR / META = neoplàsia / metàstasi
- VER / AVISAR / MIRAR = cal programar a primera hora del matí
- HIFU = tractament de focalitzat d'ultrasò, sempre a RM3
- DBS / ECP = estimulació cerebral profunda
- DRIVE / 3D DRIVE = seqüència 3D de nervis cranials

=== REGLES CRÍTIQUES DE MÀQUINA ===
1. RM5 NO TÉ BOMBA → si el protocol necessita bomba, NO assignar a RM5
2. CAIS / CAIs / peñascos → només RM1, RM2 o RM3 (mai RM4 ni RM5)
3. Hipòfisi → NO fer en RM4 ni RM5
4. EM i Epilèpsia → preferentment RM2 o RM3
5. HIFU → sempre RM3
6. Menière → RM3, 2 huecos, MATÍ (8:00-13:00h) obligatori
7. ST simple (cranial) → preferentment RM4 o RM5, deixar RM2/RM3 per casos complexos
8. Mama → NO programar RM2 i RM3 a la vegada (una sola antena de mama)

=== REGLES DE TORN (MATÍ/TARDA) ===
- Per defecte → FLEXIBLE (pot ser matí o tarda)
- SEMPRE MATI (sense excepcions): ENTERO-RM, DEFECOGRAFIA, RM RENAL, Quantificació Ferro hígado, HIFU, ESPECTROSCOPIA
- DIMARTS TARDA exclusiu: RM FETAL CRANI (RM2 exclusiu)
- Si la nota/observació conté: +ver, ver, avisar, mirar, y ver, y mirar, y avisar:
  → Si és protocol NO NEURO → MATI obligatori
  → Si és protocol NEURO → FLEXIBLE
- En qualsevol altre cas → FLEXIBLE

=== LLISTA DE PROTOCOLS ===
${buildPromptTable()}

=== NOTA CLÍNICA A ANALITZAR ===
"${text}"

=== INSTRUCCIONS ===
PRIMER DE TOT: comprova si és un protocol especial:
- Si conté HIFU → equip = RM3, maquina_nota = "HIFU → RM3 obligatori"
- Si conté MENIÈRE → equip = RM3, torn = MATI, maquina_nota = "Menière → RM3, 2 huecos, MATÍ obligatori"
- Si conté CAR-T / CART / CAR T → equip = RM3, maquina_nota = "CAR-T → RM3"

Si NO és protocol especial:
1. Descodifica abreviatures
2. Identifica zona corporal (columna/neuro/abdomen/msk)
3. Cerca el protocol correcte de la llista 1-79
4. Determina contrast i bomba
5. Torn: FLEXIBLE per defecte; MATI si obs conté VER/AVISAR/MIRAR
6. Indica maquina_nota si hi ha restriccions

Retorna ÚNICAMENT aquest JSON sense cap altre text ni markdown:
{
  "n": <número protocol 1-79>,
  "torn": "<MATI|TARDA|FLEXIBLE>",
  "maquina_nota": "<nota sobre màquina si cal>",
  "conf": "<ALTA|MITJA|BAIXA>",
  "why": "<una frase en castellà: zona identificada + protocol + torn + màquina>"
}`;
}

function resolveEquip(text: string, nomProtocol: string, defaultEquip: string): { equip1: string; equips: string } {
  const t = text.toLowerCase();
  const n = nomProtocol.toLowerCase();

  if (t.includes("hifu")) return { equip1: "RM3", equips: "RM3" };
  if (t.includes("meniere") || t.includes("menière")) return { equip1: "RM3", equips: "RM3" };
  if (isCartCase(t)) return { equip1: "RM3", equips: "RM3" };
  if (t.includes("parkinson") && (t.includes("ecp") || t.includes("dbs"))) return { equip1: "RM3", equips: "RM3" };
  if (t.includes("fetal") || t.includes("fetus")) return { equip1: "RM2", equips: "RM2" };
  if (t.includes("cais") || t.includes("penyal") || t.includes("peñascos")) return { equip1: "RM2", equips: "RM2/RM1/RM4/RM3" };
  if (t.includes("hipofis") || t.includes("hipòfis")) return { equip1: "RM2", equips: "RM2/RM1/RM3" };
  if (n.includes("medul") || t.includes("medular")) return { equip1: "RM3", equips: "RM3/RM2" };
  if (t.includes("epilepsi") || t.includes("esclerosi multiple") || t.includes("esclerosis multiple")) return { equip1: "RM3", equips: "RM3/RM2/RM1" };
  if (n.includes("canell") || t.includes("muñeca") || t.includes("mano")) return { equip1: "RM3", equips: "RM3/RM2" };
  if (n.includes("cardio") || t.includes("cardio")) return { equip1: "RM2", equips: "RM2/RM5" };
  if (n.includes("entero") || t.includes("entero") || t.includes("crohn")) return { equip1: "RM2", equips: "RM2/RM1/RM3" };
  if (n.includes("genoll") || t.includes("rodilla")) return { equip1: "RM4", equips: "RM4/RM5/RM1/RM3/RM2" };
  if (n.includes("espatlla") || t.includes("hombro")) return { equip1: "RM4", equips: "RM4/RM1/RM5/RM2/RM3" };
  if (n.includes("turmell") || n.includes("peu") || t.includes("tobillo") || t.includes("pie")) return { equip1: "RM4", equips: "RM4/RM5/RM1/RM3/RM2" };
  if (n.includes("lumbar")) return { equip1: "RM5", equips: "RM5/RM4/RM1/RM2/RM3" };
  if (n.includes("cervical")) return { equip1: "RM5", equips: "RM5/RM1/RM4/RM2/RM3" };
  if (n.includes("dorsal")) return { equip1: "RM1", equips: "RM1/RM5/RM3/RM2/RM4" };
  if (t.includes("endometriosi") || t.includes("endometriosis") || t.includes("mioma") || t.includes("pelvis femenina") || t.includes("endometri")) return { equip1: "RM5", equips: "RM5/RM2/RM3/RM1" };
  if (n.includes("recte") || n.includes("pròstata") || n.includes("prostata") || t.includes("prostata")) return { equip1: "RM2", equips: "RM2/RM3/RM1/RM4" };
  if (n.includes("fetge") || n.includes("abdomen") || t.includes("higado")) return { equip1: "RM3", equips: "RM3/RM2/RM1/RM4" };
  if (n.includes("mama")) return { equip1: "RM3", equips: "RM3/RM4/RM2/RM1" };

  const first = defaultEquip.split("/")[0] ?? defaultEquip;
  return { equip1: first, equips: defaultEquip };
}

export async function POST(request: NextRequest) {
  const identifier = getIdentifier(request);
  const rateLimitError = await checkRateLimit(identifier);
  if (rateLimitError) return rateLimitError;

  const validation = await validateBody(request, AnalyzeRequestSchema);
  if (!validation.success) return validation.response;

  const { text, anestesia: anestRaw } = validation.data;
  const cartCase = isCartCase(text);

  let anestesia = false;
  let anestMajor: boolean | null = null;
  if (anestRaw) {
    anestesia = true;
    const mEdad = anestRaw.match(/(\d+)\s*([+]?)/);
    if (mEdad) {
      const edad = parseInt(mEdad[1]);
      anestMajor = edad >= 3;
    }
  }

  if (cartCase) {
    const fallbackProtocol = EXCEL[5];
    const torn = anestesia
      ? anestMajor === false
        ? "DIVENDRES_MATI"
        : anestMajor === true
        ? "DIMARTS_TARDA"
        : "ANESTESIA"
      : "FLEXIBLE";

    return NextResponse.json({
      nom_protocol: "RM DE CERVELL SENSE/AMB CONTRAST",
      orientacio: "Caso especial CAR-T / CART",
      zona: "neuro",
      contrast: "NO",
      bomba: "NO",
      equip1: "RM3",
      equips: "RM3",
      huecos: fallbackProtocol?.huecos ?? "1",
      nota: "Se recomienda revisar el protocolo clinico completo antes de validar.",
      torn,
      maquina_nota: "CAR-T / CART -> RM3",
      conf: "MITJA",
      why: "Solicitud de CAR-T / CART sin contexto suficiente: se aplica regla interna de prioridad RM3.",
      raw: "Resolución local por patrón CAR-T / CART.",
    });
  }

  let claudeRaw = "";
  try {
    const { ANTHROPIC_API_KEY } = getServerEnv();
    let resp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: buildPrompt(text) }],
      }),
    });

    if (resp.status === 529 || resp.status === 503 || resp.status === 500) {
      resp = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 200,
          messages: [{ role: "user", content: buildPrompt(text) }],
        }),
      });
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("Error Claude API:", err);
      return NextResponse.json({ error: "Error al conectar con el servicio de IA." }, { status: 502 });
    }

    const data = await resp.json();
    claudeRaw = data.content?.[0]?.text ?? "";
  } catch (err) {
    console.error("Fetch Claude fallido:", err);
    return NextResponse.json({ error: "Error de red al llamar al servicio de IA." }, { status: 502 });
  }

  let parsed;
  try {
    const match = claudeRaw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON en respuesta");
    parsed = ClaudeResultSchema.parse(JSON.parse(match[0]));
  } catch {
    console.error("Respuesta no válida de Claude:", claudeRaw);
    const fallbackProtocol = EXCEL[0];
    const fallbackTorn = anestesia
      ? anestMajor === false
        ? "DIVENDRES_MATI"
        : anestMajor === true
        ? "DIMARTS_TARDA"
        : "ANESTESIA"
      : "FLEXIBLE";

    return NextResponse.json({
      nom_protocol: "No clasificado",
      orientacio: cartCase ? "Caso especial CAR-T / CART" : "La nota no se pudo interpretar de forma fiable",
      zona: "indeterminada",
      contrast: "DEPENDE",
      bomba: "DEPENDE",
      equip1: "RM3",
      equips: "RM3",
      huecos: fallbackProtocol?.huecos ?? "1",
      nota: cartCase
        ? "CAR-T / CART -> RM3"
        : "Requiere revisión manual: la IA devolvió una respuesta no estructurada.",
      torn: fallbackTorn,
      maquina_nota: cartCase ? "CAR-T / CART -> RM3" : "",
      conf: "BAIXA",
      why: cartCase
        ? "Solicitud de CAR-T / CART sin contexto suficiente: se aplica regla interna de prioridad RM3."
        : "La entrada no encaja bien con una nota clínica tipica de RM o la respuesta del modelo no fue parseable.",
      raw: claudeRaw,
    });
  }

  const protocol = EXCEL[Math.max(0, parsed.n - 1)] ?? EXCEL[0];
  const { equip1, equips } = anestesia
    ? { equip1: "RM1", equips: "RM1" }
    : resolveEquip(text, protocol.nom, protocol.equip);

  const torn = anestesia
    ? anestMajor === false ? "DIVENDRES_MATI"
    : anestMajor === true ? "DIMARTS_TARDA"
    : "ANESTESIA"
    : parsed.torn;

  return NextResponse.json({
    nom_protocol: protocol.nom,
    orientacio: protocol.ori,
    zona: protocol.zona,
    contrast: protocol.contrast,
    bomba: protocol.bomba,
    equip1,
    equips,
    huecos: protocol.huecos,
    nota: protocol.nota,
    torn,
    maquina_nota: parsed.maquina_nota ?? "",
    conf: parsed.conf,
    why: parsed.why,
    raw: claudeRaw,
  });
}

