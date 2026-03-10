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

// ── Few-shot dinàmic des de Supabase (correccions reals de les administratives) ──

async function fetchFewShots(supabaseUrl: string, supabaseKey: string): Promise<string> {
  try {
    const url = `${supabaseUrl}/rest/v1/rm_feedback?decisio=eq.validat&order=created_at.desc&limit=15&select=nota_radioleg,correccio_protocol_n,correccio_nom_protocol,correccio_torn,correccio_equip1,correccio_comment`;
    const r = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!r.ok) return "";
    const rows = await r.json();
    if (!rows.length) return "";
    const examples = rows.map((row: Record<string, string | number | null>, i: number) =>
      `[${i + 1}] Nota: "${row.nota_radioleg}" → Protocol correcte: ${row.correccio_protocol_n} (${row.correccio_nom_protocol}), Torn: ${row.correccio_torn}, Equip: ${row.correccio_equip1}${row.correccio_comment ? `, Nota: ${row.correccio_comment}` : ""}`
    ).join("\n");
    return `\n=== CORRECCIONS REALS DE LES ADMINISTRATIVES (aprèn d'aquests casos) ===\n${examples}\n`;
  } catch {
    return "";
  }
}

// ── System prompt: todo el conocimiento de la chuleta ────────────────────

function buildSystemPrompt(fewShots: string = ""): string {
  return `Ets un assistent expert en programació de resonàncies magnètiques (RM) de l'Hospital de Sant Pau. El teu únic rol és analitzar notes clíniques i retornar el protocol, màquina, torn i altres dades de programació.

=== MÀQUINES DISPONIBLES ===
- RM1: 1.5T, gantry 60cm, TÉ bomba
- RM2: 3T, gantry 60cm, TÉ bomba
- RM3: 3T, gantry 70cm, TÉ bomba
- RM4: 1.5T, gantry 70cm, TÉ bomba
- RM5: 1.5T, gantry 70cm, NO TÉ BOMBA (restricció absoluta)

=== ABREVIATURES ===
ST/ESTANDAR = estàndard sense contrast (llevat +C)
+C/CTE/CONTRASTE/CON CONTRASTE/ELUCIREM/GADOLINI = contrast IV
TOF/TOF3D/TOF 3D/TOF-3D/ANGIO-RM/ANGIO RM/ARM/ANGIO WILLIS/WILLIS = angio RM sense contrast, sense bomba
PERFU/PERFUSION/PERFUSIÓ = perfusió cerebral, SEMPRE contrast+bomba, MAI RM5
DIFU/DIFUSION/DIFUSIÓ/DWI = difusió cerebral, SEMPRE contrast+bomba, MAI RM5
SPECTRO/ESPECTRO/ESPECTROSCOPIA = espectroscopia cerebral, RM3, SEMPRE MATÍ
ARTRO/ARTROGRAFIA/ARTRO-RM = artro-RM espatlla/maluc, RM1 EXCLUSIU
mpMRI/MULTIPARAMETRIC/MULTIPARAMETRICA/MULTIPARAMÈTRICA = sempre contrast (pròstata, mama)
CAIS/CAIs/PENYAL/PEÑASCOS/OIDO INTERNO = base de crani / peñascos → MAI RM4 ni RM5
TSA/TRONCOS SUPRAAOTICS/CAROTIDES = troncos supraortics (angio cervical)
DVP/VP SHUNT/VENTRICULOPERITONEAL = derivació ventriculoperitoneal
ATM/TEMPORO/TEMPOROMANDIBULAR = articulació temporomandibular
EM/ESCLEROSI MULTIPLE/ESCLEROSIS MULTIPLE/DESMIELINITZANT = esclerosi múltiple → preferir RM2/RM3
AVC/ICTUS/AIT/STROKE/ISQUÈMIC = ictus isquèmic
CRI/CIRCUITO RAPIDO DE ICTUS/CIRCUIT RAPID ICTUS = ⚠️ PRIORITAT MÀXIMA: protocol 15, EXCLUSIU RM3>RM5, MAI RM1/RM2/RM4, màxim 3 dies des de sol·licitud
EII/CROHN/ENTERO/ENTERO-RM = Entero-RM → SEMPRE MATÍ
VER/AVISAR/MIRAR/URGENTE/URGENT = programar matí obligatori
HIFU/ULTRASONS FOCALITZATS = ultrasons focalitzats → RM3 EXCLUSIU, SEMPRE MATÍ
DBS/ECP/ESTIMULACIÓ CEREBRAL = estimulació cerebral profunda
CAR-T/CART/CELLT = seguiment CAR-T → RM3 sempre
FETAL/RM FETAL = RM fetal cranial → RM2 EXCLUSIU, DIMARTS TARDA
ANESTESIA/SEDACIO/SEDACIÓN/PEDIATRIA = pediatria → RM1 EXCLUSIU
COLANGIO/CPRM/COLANGIOPANCREA = colangiografia RM
FERRO/HIERRO HEPATICO/QUANTIFICACIÓ FERRO = quantificació ferro fetge → SEMPRE MATÍ
MAMA/BREAST = mama diagnòstica o protesi
PROTESI/IMPLANT MAMARI = control protesi mamaria
NEO/NEOPLASIA/TUMOR/CARCINOMA/CA = patologia neoplàstica → considerar contrast
MENIÈRE/MENIERE = RM3 EXCLUSIU, 2 huecos, MATÍ 8-13h

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
17. Ferro hígado → MATÍ, NOMÉS RM5/RM4 (ja no es fa a RM1)
18. Espectroscopia → RM3, MATÍ, avisar radióleg
19. Neo Cervix → MATÍ, avisar radióleg
20. Crani + T2 DRIVE de CAIS → 1 hueco, sense contrast
21. CRI (Circuito Rápido de Ictus) → protocol 15, EXCLUSIU RM3 (prioritari) o RM5. MAI RM1, RM2 ni RM4. Programar en màxim 3 dies naturals des de la sol·licitud.

=== REGLES DE TORN ===
SEMPRE MATÍ: ENTERO-RM, DEFECOGRAFIA, RENAL, FERRO, HIFU, ESPECTROSCOPIA, NEO CERVIX
DIMARTS TARDA: FETAL CRANI
FLEXIBLE: tots els altres (llevat que la nota/observació contingui ver/avisar/mirar → MATÍ)
EXCEPCIÓ NEURO + VER/AVISAR: si és neuro i hi ha ver/avisar, dijous i divendres pot ser TARDA igualment

=== LLISTA COMPLETA DE PROTOCOLS (1-66) ===
${buildPromptTable()}

=== CASOS FREQÜENTS I AMBIGUS ===
- "TOF" o "TOF 3D" sol → protocol 14 (Cervell + Angio Willis) si context ictus; sino protocol 15 (RM ICTUS)
- "RM CERVELL + TOF/WILLIS" → protocol 14
- "PERFU + DIFU" junts → protocol 66, contrast+bomba, MAI RM5
- "SPECTRO" sense altra info → protocol 64, RM3, MATÍ, avisar radióleg
- "mpMRI PRÒSTATA" → protocol 43
- "mpMRI MAMA" → protocol 58
- "ST simple cerebral" sense etiologia → protocol 6, preferir RM4/RM5
- "EM debut" → protocol 4 (debut); "EM brot/brote" → protocol 5
- "DBS 3T" → protocol 8; "DBS 1.5T" → protocol 9 (RM5 exclusiu)
- "CARDIO / CARDIOPATIA" → protocol 62, RM2>RM5, MAI RM3/RM4
- "CAR-T / CART" → protocol 65, RM3 sempre
- "MENIÈRE" → protocol 18, RM3, 2 huecos, MATÍ 8-13h obligatori
- "ENTERO / CROHN / EII" → protocol 37, SEMPRE MATÍ
- "FERRO / HIERRO HEPÀTIC" → protocol 31, SEMPRE MATÍ, RM5/RM4 (MAI RM1)
- "COLANGIO + contrast" → protocol 34; "COLANGIO sense contrast" → protocol 35
- "DEFECO / DEFECOGRAFIA" → protocol 45, MATÍ, MAI RM4
- "FETAL CRANI" → protocol 46, RM2 EXCLUSIU, DIMARTS TARDA
- "TOTAL BODY / COS SENCER / LIMFOMA" → protocol 60, RM1/RM5
- "MÀ / CANELL" → protocol 53, 3T obligatori (RM3>RM2), MAI RM1/RM4/RM5
- "EPILÈPSIA" → protocol 10, preferir RM3/RM2 (no RM5 com a primera opció)
- "CARA / SINS / FOSA NASAL" → protocol 21, equip RM2/RM3 primer (no RM5/RM4)
- "CRI" o "CIRCUITO RAPIDO DE ICTUS" → protocol 15, EXCLUSIU RM3>RM5, MAI RM1/RM2/RM4, màxim 3 dies
- "CRANI + T2 DRIVE / CAIS" → 1 hueco, sense contrast (protocol 17)
- Si la nota conté "ver/avisar/mirar/urgente/urgent" → torn MATI obligatori
- EXCEPCIÓ: si és NEURO + ver/avisar + dijous o divendres → pot ser TARDA igualment

=== GUIA DE CONFIANÇA ===
ALTA: nota molt específica (diagnòstic clar, protocol inequívoc)
MITJA: zona identificada però protocol o màquina amb dubte
BAIXA: nota vaga, múltiples protocols possibles, o restriccions que no s'especifiquen

${fewShots}
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

function buildUserMessage(text: string, anestesia: boolean, anestMajor: boolean | null, isCRI: boolean): string {
  let msg = `Nota clínica: "${normalizeInput(text)}"`;
  if (anestesia) {
    if (anestMajor === false) msg += "\n[ANESTESIA PEDIÀTRICA: menor de 3 anys → RM1, DIVENDRES MATÍ]";
    else if (anestMajor === true) msg += "\n[ANESTESIA PEDIÀTRICA: 3 anys o més → RM1, DIMARTS TARDA]";
    else msg += "\n[ANESTESIA PEDIÀTRICA: edat no especificada → RM1]";
  }
  if (isCRI) {
    msg += "\n[CRI — CIRCUITO RÁPIDO DE ICTUS: protocol 15, EXCLUSIU RM3 (prioritari) o RM5. MAI RM1, RM2 ni RM4. Màxim 3 dies des de la sol·licitud.]";
  }
  return msg;
}

// ── Extreu equip1 i equips directament del protocol del Excel ────────────
// L'ordre de prioritat ja és correcte al excel.ts — no cal sobreescriure'l.

function resolveEquip(defaultEquip: string): { equip1: string; equips: string } {
  const equip1 = defaultEquip.split("/")[0]?.trim() ?? defaultEquip;
  return { equip1, equips: defaultEquip };
}

// ── Normalització del vocabulari clínic ──────────────────────────────────
// Homogeneïtza abreviatures i variants tipogràfiques ABANS d'enviar a Claude.

const CLINICAL_ALIASES: [RegExp, string][] = [
  // TOF / Angio RM
  [/\btof[\s_-]?3d\b/gi,                    "TOF 3D"],
  [/\btof[\s_-]?2d\b/gi,                    "TOF"],
  [/\bangio[\s_-]?rm\b/gi,                  "TOF"],
  [/\b(arm|angiorm)\b/gi,                   "TOF"],
  // Perfusió
  [/\bperfusi[oó]n?\b/gi,                   "PERFUSION"],
  [/\bperfu\b/gi,                           "PERFUSION"],
  // Difusió
  [/\bdifusi[oó]n?\b/gi,                    "DIFUSION"],
  [/\bdifu\b/gi,                            "DIFUSION"],
  [/\bdwi\b/gi,                             "DIFUSION"],
  // Espectroscòpia
  [/\bespectroscop[íi]a\b/gi,               "ESPECTROSCOPIA"],
  [/\bspectro\b/gi,                         "ESPECTROSCOPIA"],
  // EM / Esclerosi múltiple
  [/\besclerosi[\s_-]?m[uú]ltiple\b/gi,     "EM"],
  // Ictus
  [/\bictus\b/gi,                           "AVC"],
  [/\bstroke\b/gi,                          "AVC"],
  [/\bait\b/gi,                             "AVC"],
  // Entero / Crohn
  [/\bentero[\s_-]?rm\b/gi,                 "ENTERO"],
  [/\beii\b/gi,                             "ENTERO"],
  [/\bcrohn\b/gi,                           "ENTERO"],
  // Artrografia
  [/\bartro[\s_-]?rm\b/gi,                  "ARTRO"],
  [/\bartrografi[ae]\b/gi,                  "ARTRO"],
  // CAR-T
  [/\bcart\b/gi,                            "CAR-T"],
  [/\bcar[\s_-]t\b/gi,                      "CAR-T"],
  // DVP
  [/\bv[\s_-]?p[\s_-]?shunt\b/gi,          "DVP"],
  // DBS / ECP
  [/\becp\b/gi,                             "DBS"],
  // TSA
  [/\btroncos[\s_-]?supraao[rò]tics\b/gi,  "TSA"],
  // HIFU
  [/\bultrasons[\s_-]?focalitzats\b/gi,     "HIFU"],
  // Defecografia
  [/\bdefeco\b/gi,                          "DEFECOGRAFIA"],
  // mpMRI / multiparamètrica
  [/\bmpmri\b/gi,                           "mpMRI"],
  [/\bmultiparamet[rè]ic[ae]?\b/gi,         "mpMRI"],
  // CRI — Circuito Rápido de Ictus
  [/\bcircuito[\s_-]?r[aá]pido[\s_-]?(?:de[\s_-]?)?ictus\b/gi, "CRI"],
  [/\bcircuit[\s_-]?r[aà]pid[\s_-]?(?:d['']?)?ictus\b/gi,      "CRI"],
];

function normalizeInput(text: string): string {
  let out = text;
  for (const [re, canonical] of CLINICAL_ALIASES) {
    out = out.replace(re, canonical);
  }
  return out;
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

  // ── Detecció determinista de CRI ──────────────────────────────────────────
  const isCRI = /\bcri\b|circuito[\s_-]?r[aá]pido[\s_-]?(?:de[\s_-]?)?ictus|circuit[\s_-]?r[aà]pid[\s_-]?(?:d['']?)?ictus/i.test(text);

  // ── Few-shot dinàmic: correccions reals de Supabase ──────────────────────
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? "";
  const fewShots = supabaseUrl && supabaseKey
    ? await fetchFewShots(supabaseUrl, supabaseKey)
    : "";

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
        system: buildSystemPrompt(fewShots),
        messages: [{ role: "user", content: buildUserMessage(text, anestesia, anestMajor, isCRI) }],
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
          system: buildSystemPrompt(fewShots),
          messages: [{ role: "user", content: buildUserMessage(text, anestesia, anestMajor, isCRI) }],
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

  const protocol = EXCEL[Math.max(0, parsed.n - 1)] ?? EXCEL[0];
  const { equip1, equips } = resolveEquip(protocol.equip);

  // ── Torn: anestèsia sempre imposa el torn, independentment de Claude ──────
  let torn = parsed.torn;
  if (anestesia) {
    if (anestMajor === false) torn = "DIVENDRES_MATI";
    else if (anestMajor === true) torn = "DIMARTS_TARDA";
    else torn = "ANESTESIA";
  }

  // ── CRI: override determinista de màquina ─────────────────────────────────
  let finalEquip1 = equip1;
  let finalEquips = equips;
  if (isCRI) {
    finalEquip1 = "RM3";
    finalEquips = "RM3/RM5";
  }

  // ── Nota màquina: generada de forma determinista per consistència ─────────
  function buildMaquinaNota(): string {
    if (anestesia) {
      if (anestMajor === false) return "RM1 exclusiu · Divendres matí (pacient <3 anys)";
      if (anestMajor === true)  return "RM1 exclusiu · Dimarts tarda (pacient ≥3 anys)";
      return "RM1 exclusiu · Edat no especificada";
    }
    if (isCRI) return "⚠ CRI: EXCLUSIU RM3 (prioritari) o RM5. MAI RM1, RM2 ni RM4. Màxim 3 dies des de la sol·licitud.";
    if (!protocol.nota) return "";
    const n = protocol.nota.replace(/^⚠\s*/, "");
    // Mostrar nota màquina només si conté restricció de màquina rellevant
    if (/EXCLUSIU|MAI RM|NO RM|3T obligatori|MAI RM4|MAI RM5/i.test(n)) return n;
    return "";
  }

  return NextResponse.json({
    protocol_n: protocol.n,
    nom_protocol: protocol.nom,
    orientacio: protocol.ori,
    zona: protocol.zona,
    contrast: protocol.contrast,
    bomba: protocol.bomba,
    equip1: finalEquip1,
    equips: finalEquips,
    huecos: protocol.huecos,
    nota: protocol.nota,
    torn,
    maquina_nota: buildMaquinaNota(),
    conf: parsed.conf,
    why: parsed.why,
    raw: claudeRaw,
  });
}
