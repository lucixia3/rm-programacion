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

// ── System prompt: todo el conocimiento de la chuleta ────────────────────

function buildSystemPrompt(): string {
  return `Ets un assistent expert en programació de resonàncies magnètiques (RM) de l'Hospital de Sant Pau. El teu únic rol és analitzar notes clíniques i retornar el protocol, màquina, torn i altres dades de programació.

=== MÀQUINES DISPONIBLES ===
- RM1: 1.5T, gantry 60cm, TÉ bomba
- RM2: 3T, gantry 60cm, TÉ bomba
- RM3: 3T, gantry 70cm, TÉ bomba
- RM4: 1.5T, gantry 70cm, TÉ bomba
- RM5: 1.5T, gantry 70cm, NO TÉ BOMBA (restricció absoluta)

=== ABREVIATURES ===
ST/ESTANDAR = estàndard sense contrast (llevat +C)
+C/CTE/CONTRASTE/ELUCIREM = contrast IV
TOF/ANGIO-RM/ARM = angio RM sense contrast, sense bomba
PERFU/PERFUSION = perfusió cerebral, SEMPRE contrast+bomba, MAI RM5
DIFU/DIFUSION/DWI = difusió, SEMPRE contrast+bomba, MAI RM5
SPECTRO/ESPECTROSCOPIA = espectroscopia cerebral, RM3, SEMPRE MATÍ
ARTRO/ARTROGRAFIA = artro-RM espatlla/maluc, RM1 EXCLUSIU
mpMRI/MULTIPARAMETRICA = sempre contrast (pròstata, mama)
CAIS/CAIs/PENYAL = base de crani / peñascos → MAI RM4 ni RM5
TSA = troncos supraortics (angio cervical)
DVP = derivació ventriculoperitoneal
ATM = articulació temporomandibular
EM/ESCLEROSI MULTIPLE = esclerosi múltiple → preferir RM2/RM3
AVC/ICTUS/AIT/STROKE = ictus isquèmic
EII/CROHN/ENTERO = Entero-RM → SEMPRE MATÍ
VER/AVISAR/MIRAR = programar matí
HIFU = ultrasons focalitzats → RM3 EXCLUSIU, SEMPRE MATÍ
DBS/ECP = estimulació cerebral profunda
CAR-T/CART = seguiment CAR-T → RM3 sempre
FETAL = RM fetal cranial → RM2 EXCLUSIU, DIMARTS TARDA
ANESTESIA/SEDACIO = pediatria → RM1 EXCLUSIU

=== RESTRICCIONS ABSOLUTES DE MÀQUINA ===
1. RM5 NO TÉ BOMBA → excloure RM5 si bomba=SI
2. CAIS/peñascos → MAI RM4 ni RM5
3. Hipòfisi → MAI RM4 ni RM5
4. EM/Epilèpsia → preferir RM2 o RM3
5. HIFU → RM3 EXCLUSIU
6. Menière → RM3 EXCLUSIU, 2 huecos, MATÍ 8-13h
7. ST simple cranial → preferir RM4/RM5 (alliberar RM2/RM3)
8. Mama → NO programar RM2 i RM3 alhora (1 sola antena)
9. Mà/canell → RM3>RM2 ÚNICAMENT (3T obligatori)
10. Cardio → RM2>RM5, MAI RM3/RM4
11. PERFU/DIFU → contrast+bomba obligatori, MAI RM5
12. Fetal → RM2 EXCLUSIU, DIMARTS TARDA
13. Anestesia <3a → RM1, DIVENDRES MATÍ
14. Anestesia ≥3a → RM1, DIMARTS TARDA
15. Defecografia → MATÍ, MAI RM4
16. Renal → MATÍ
17. Ferro hígado → MATÍ
18. Espectroscopia → RM3, MATÍ, avisar radióleg
19. Neo Cervix → MATÍ, avisar radióleg

=== REGLES DE TORN ===
SEMPRE MATÍ: ENTERO-RM, DEFECOGRAFIA, RENAL, FERRO, HIFU, ESPECTROSCOPIA, NEO CERVIX
DIMARTS TARDA: FETAL CRANI
FLEXIBLE: tots els altres (llevat que la nota/observació contingui ver/avisar/mirar → MATÍ)

=== LLISTA COMPLETA DE PROTOCOLS (1-66) ===
${buildPromptTable()}

=== FORMAT DE RESPOSTA ===
Retorna ÚNICAMENT aquest JSON, sense cap altre text ni markdown:
{
  "n": <número del protocol 1-66>,
  "torn": "<MATI|TARDA|FLEXIBLE|DIMARTS_TARDA|DIVENDRES_MATI>",
  "maquina_nota": "<avís de màquina si cal, o cadena buida>",
  "conf": "<ALTA|MITJA|BAIXA>",
  "why": "<una frase en castellà: zona + protocol identificat + torn + màquina>"
}`;
}

function buildUserMessage(text: string, anestesia: boolean, anestMajor: boolean | null): string {
  let msg = `Nota clínica: "${text}"`;
  if (anestesia) {
    if (anestMajor === false) msg += "\n[ANESTESIA PEDIÀTRICA: menor de 3 anys → RM1, DIVENDRES MATÍ]";
    else if (anestMajor === true) msg += "\n[ANESTESIA PEDIÀTRICA: 3 anys o més → RM1, DIMARTS TARDA]";
    else msg += "\n[ANESTESIA PEDIÀTRICA: edat no especificada → RM1]";
  }
  return msg;
}

// ── Extreu equip1 i equips directament del protocol del Excel ────────────
// L'ordre de prioritat ja és correcte al excel.ts — no cal sobreescriure'l.

function resolveEquip(defaultEquip: string): { equip1: string; equips: string } {
  const equip1 = defaultEquip.split("/")[0]?.trim() ?? defaultEquip;
  return { equip1, equips: defaultEquip };
}

// ── Handler principal ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const identifier = getIdentifier(request);
  const rateLimitError = await checkRateLimit(identifier);
  if (rateLimitError) return rateLimitError;

  const validation = await validateBody(request, AnalyzeRequestSchema);
  if (!validation.success) return validation.response;

  const { text, anestesia: anestRaw } = validation.data;

  let anestesia = false;
  let anestMajor: boolean | null = null;
  if (anestRaw) {
    anestesia = true;
    const m = anestRaw.match(/(\d+)/);
    if (m) anestMajor = parseInt(m[1]) >= 3;
  }

  // ── Llamada a Claude con system prompt completo ───────────────────────────

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
        max_tokens: 300,
        system: buildSystemPrompt(),
        messages: [{ role: "user", content: buildUserMessage(text, anestesia, anestMajor) }],
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
          max_tokens: 300,
          system: buildSystemPrompt(),
          messages: [{ role: "user", content: buildUserMessage(text, anestesia, anestMajor) }],
        }),
      });
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("Error Claude API:", err);
      return NextResponse.json({ error: "Error al conectar con el servicio de IA." }, { status: 502 });
    }

    claudeRaw = (await resp.json()).content?.[0]?.text ?? "";
  } catch (err) {
    console.error("Fetch Claude fallido:", err);
    return NextResponse.json({ error: "Error de red al llamar al servicio de IA." }, { status: 502 });
  }

  // ── Parse resposta Claude ─────────────────────────────────────────────────

  let parsed;
  try {
    const match = claudeRaw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    parsed = ClaudeResultSchema.parse(JSON.parse(match[0]));
  } catch {
    console.error("Resposta Claude no vàlida:", claudeRaw);
    return NextResponse.json({
      nom_protocol: "No clasificado",
      orientacio: "La nota no se pudo interpretar de forma fiable",
      zona: "indeterminada",
      contrast: "DEPENDE",
      bomba: "DEPENDE",
      equip1: "—",
      equips: "—",
      huecos: "1",
      nota: "Requiere revisión manual.",
      torn: "FLEXIBLE",
      maquina_nota: "",
      conf: "BAIXA",
      why: "La entrada no encaja con ningún protocolo conocido o la respuesta del modelo no fue parseable.",
      raw: claudeRaw,
    });
  }

  // torn con anestesia viene ya indicado en el user message; Claude lo aplica
  const protocol = EXCEL[Math.max(0, parsed.n - 1)] ?? EXCEL[0];
  const { equip1, equips } = resolveEquip(protocol.equip);

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
    torn: parsed.torn,
    maquina_nota: parsed.maquina_nota ?? "",
    conf: parsed.conf,
    why: parsed.why,
    raw: claudeRaw,
  });
}
