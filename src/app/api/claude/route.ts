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

// ── Detección local de casos especiales (no van a Claude) ─────────────────

function isHifuCase(t: string)     { return t.toLowerCase().includes("hifu"); }
function isCartCase(t: string)     { const n = t.toLowerCase(); return /\bcar[\s\-\/]*t\b/.test(n) || n.includes("cart"); }
function isMeniereCase(t: string)  { const n = t.toLowerCase(); return n.includes("meniere") || n.includes("menière") || n.includes("meniere"); }
function isFetal(t: string)        { const n = t.toLowerCase(); return n.includes("fetal") || n.includes("fetus"); }
function isAnestesia(t: string)    { const n = t.toLowerCase(); return n.includes("anestesia") || n.includes("sedaci") || n.includes("sedacion"); }
function isEspectroscopia(t: string) { const n = t.toLowerCase(); return n.includes("spectro") || n.includes("espectro"); }
function isPerfuDifu(t: string)    { const n = t.toLowerCase(); return n.includes("perfu") || n.includes("perfusi") || n.includes("difu") || n.includes("difusi"); }

// ── Resolución de equipo a partir del texto y protocolo ───────────────────

function resolveEquip(text: string, nomProtocol: string, defaultEquip: string): { equip1: string; equips: string } {
  const t = text.toLowerCase();
  const n = nomProtocol.toLowerCase();

  // Exclusivos duros (igual que resolución local pero como fallback de seguridad)
  if (isHifuCase(t))                                                        return { equip1: "RM3", equips: "RM3" };
  if (isMeniereCase(t))                                                     return { equip1: "RM3", equips: "RM3" };
  if (isCartCase(t))                                                        return { equip1: "RM3", equips: "RM3" };
  if (isEspectroscopia(t))                                                  return { equip1: "RM3", equips: "RM3" };
  if (isPerfuDifu(t))                                                       return { equip1: "RM3", equips: "RM3/RM2/RM1" };
  if (t.includes("parkinson") && (t.includes("ecp") || t.includes("dbs"))) return { equip1: "RM3", equips: "RM3" };
  if (t.includes("dbs 3t") || t.includes("dbs3t"))                         return { equip1: "RM3", equips: "RM3" };
  if (t.includes("dbs 1.5") || t.includes("dbs1.5"))                       return { equip1: "RM5", equips: "RM5" };
  if (isFetal(t))                                                           return { equip1: "RM2", equips: "RM2" };
  if (t.includes("cais") || t.includes("penyal") || t.includes("peñascos"))return { equip1: "RM2", equips: "RM2/RM1/RM4/RM3" };
  if (t.includes("hipofis") || t.includes("hipòfis") || t.includes("hipopituï") || t.includes("hiperprolact") || t.includes("adenoma hipofis") || t.includes("macroadenoma")) return { equip1: "RM3", equips: "RM3/RM2" };
  if (n.includes("medul") || t.includes("medular") || n.includes("columna completa")) return { equip1: "RM3", equips: "RM3/RM2/RM5/RM4/RM1" };
  if (t.includes("epilepsi") || t.includes("esclerosi mult") || t.includes("esclerosis mult")) return { equip1: "RM3", equips: "RM3/RM2/RM1" };
  if (n.includes("canell") || n.includes("mà") || t.includes("muñeca") || t.includes("canell") || t.includes("dits"))  return { equip1: "RM3", equips: "RM3/RM2" };
  if (n.includes("cardio") || t.includes("cardio") || t.includes("cardiopatia")) return { equip1: "RM2", equips: "RM2/RM5" };
  if (n.includes("entero") || t.includes("entero") || t.includes("crohn") || t.includes("eii")) return { equip1: "RM2", equips: "RM2/RM1/RM3" };
  if (n.includes("renal") || t.includes("renal") || t.includes("rinyó"))   return { equip1: "RM2", equips: "RM2/RM3" };
  if (n.includes("colangio") && (t.includes("fetge") || t.includes("higado") || t.includes("contraste") || t.includes("contrast"))) return { equip1: "RM1", equips: "RM1/RM5/RM2/RM3" };
  if (n.includes("colangio"))                                               return { equip1: "RM5", equips: "RM5/RM4/RM1/RM2" };
  if (n.includes("pancrees") || t.includes("pancreas") || t.includes("pàncrees")) return { equip1: "RM5", equips: "RM5/RM3/RM2" };
  if (n.includes("genoll") || t.includes("rodilla"))                       return { equip1: "RM4", equips: "RM4/RM5/RM1" };
  if (n.includes("artro") || t.includes("artro") || t.includes("artrografia")) return { equip1: "RM1", equips: "RM1" };
  if (n.includes("espatlla") || t.includes("hombro") || t.includes("espatlla")) return { equip1: "RM4", equips: "RM4/RM1/RM5" };
  if (n.includes("turmell") || n.includes("peu") || t.includes("tobillo") || t.includes("peu") || t.includes("taló")) return { equip1: "RM4", equips: "RM4/RM5/RM1" };
  if (n.includes("maluc") || t.includes("cadera") || t.includes("maluc"))  return { equip1: "RM4", equips: "RM4/RM1/RM5" };
  if (n.includes("colze") || t.includes("codo") || t.includes("epicondil")) return { equip1: "RM5", equips: "RM5/RM4/RM1" };
  if (n.includes("sacroil") || t.includes("sacroil"))                      return { equip1: "RM5", equips: "RM5/RM4/RM1" };
  if (n.includes("lumbar"))                                                 return { equip1: "RM5", equips: "RM5/RM4/RM1/RM2/RM3" };
  if (n.includes("cervical"))                                               return { equip1: "RM5", equips: "RM5/RM1/RM4/RM2/RM3" };
  if (n.includes("dorsal"))                                                 return { equip1: "RM1", equips: "RM1/RM5/RM2/RM3/RM4" };
  if (t.includes("endometriosi") || t.includes("endometriosis") || t.includes("mioma") || t.includes("pelvis femenina")) return { equip1: "RM5", equips: "RM5/RM2/RM3/RM1" };
  if (t.includes("cervix") || t.includes("còll uterí") || t.includes("neo cervix")) return { equip1: "RM2", equips: "RM2/RM3/RM5" };
  if (n.includes("recte") || n.includes("pròstata") || n.includes("prostata") || t.includes("prostata") || t.includes("fistula")) return { equip1: "RM3", equips: "RM3/RM2/RM4" };
  if (n.includes("fetge") || n.includes("abdomen") || t.includes("higado") || t.includes("hígado")) return { equip1: "RM3", equips: "RM3/RM2/RM1/RM4" };
  if (n.includes("mama"))                                                   return { equip1: "RM3", equips: "RM3/RM4/RM2/RM1" };
  if (n.includes("tòrax") || n.includes("torax") || t.includes("torax") || t.includes("tòrax")) return { equip1: "RM4", equips: "RM4/RM1/RM3" };
  if (n.includes("cos sencer") || t.includes("total body") || t.includes("cos sencer")) return { equip1: "RM1", equips: "RM1/RM5" };

  const first = defaultEquip.split("/")[0] ?? defaultEquip;
  return { equip1: first, equips: defaultEquip };
}

function buildPrompt(text: string): string {
  return `Ets un assistent de programació de RM en un hospital espanyol. Entens abreviatures mèdiques en castellà i català.

=== ABREVIATURES RADIOLÒGIQUES ===
- ST / ESTANDAR / STANDARD = protocol estàndard, sense contrast llevat que posi +C
- +C / CTE / CONTRASTE / ELUCIREM = amb contrast IV
- TOF / TOF3D / ANGIO-RM / ARM = angiografia RM sense contrast, sense bomba
- PERFU / PERFUSION = perfusió cerebral, SEMPRE amb contrast I amb bomba. MAI RM5
- DIFU / DIFUSION / DWI = difusió, SEMPRE amb contrast i amb bomba. MAI RM5
- SPECTRO / ESPECTROSCOPIA = espectroscopia cerebral, RM3, SEMPRE MATI, avisar radióleg
- FLAIR / SWI / SWAN / STIR / T1 / T2 = tipus de seqüència, no impliquen contrast
- ARTRO / ARTROGRAFIA = artro-RM espatlla/maluc, RM1 EXCLUSIU, sense contrast IV
- mpMRI / MULTIPARAMETRICA = multiparamètrica, sempre amb contrast (pròstata, mama)
- CAIS / CAIs / PENYAL = base de crani / peñascos (oïda interna) → MAI RM4 ni RM5
- TSA = troncos supraorticos (angio cervical)
- DVP = derivació ventriculoperitoneal
- ATM = articulació temporomandibular
- EM / ESCLEROSI MULTIPLE = esclerosi múltiple → preferir RM2/RM3
- AVC / ICTUS / AIT / STROKE = ictus isquèmic
- EII / CROHN / ENTERO = malaltia inflamatòria intestinal, Entero-RM → SEMPRE MATI
- NEO / CA / K / TUMOR / META = neoplàsia / metàstasi
- VER / AVISAR / MIRAR = cal programar a primera hora del matí
- HIFU = tractament d'ultrasons focalitzats, RM3 EXCLUSIU, SEMPRE MATI
- DBS / ECP = estimulació cerebral profunda
- CAR-T / CART = tractament CAR-T seguiment, RM3 sempre
- FETAL = RM fetal cranial, RM2 EXCLUSIU, DIMARTS TARDA
- ANESTESIA / SEDACIO = pediatria, RM1 EXCLUSIU

=== REGLES CRÍTIQUES DE MÀQUINA ===
1. RM5 NO TÉ BOMBA → si el protocol necessita bomba, EXCLOURE RM5
2. CAIS / CAIs / peñascos → MAI RM4 ni RM5 (només RM1/RM2/RM3)
3. Hipòfisi → MAI RM4 ni RM5
4. EM i Epilèpsia → preferentment RM2 o RM3
5. HIFU → RM3 EXCLUSIU, SEMPRE MATI
6. Menière → RM3 EXCLUSIU, 2 huecos, MATI 8-13h obligatori
7. ST simple cranial → preferir RM4/RM5, alliberar RM2/RM3
8. Mama → NO programar RM2 i RM3 alhora (1 sola antena)
9. Mà/canell → RM3>RM2 EXCLUSIU (3T obligatori)
10. Cardio → RM2>RM5, MAI RM3/RM4
11. PERFU/DIFU → sempre contrast+bomba, MAI RM5

=== REGLES DE TORN (MATÍ/TARDA) ===
- Per defecte → FLEXIBLE
- SEMPRE MATI: ENTERO-RM, DEFECOGRAFIA, RM RENAL, Ferro hígado, HIFU, ESPECTROSCOPIA, Neo Cervix
- DIMARTS TARDA: RM FETAL (RM2 exclusiu)
- Si nota/observació conté ver/avisar/mirar → MATI (excepte neuro: FLEXIBLE)

=== LLISTA DE PROTOCOLS (1-66) ===
${buildPromptTable()}

=== NOTA CLÍNICA A ANALITZAR ===
"${text}"

=== INSTRUCCIONS ===
Identifica el protocol (n 1-66), torn i màquina. Retorna ÚNICAMENT aquest JSON:
{
  "n": <1-66>,
  "torn": "<MATI|TARDA|FLEXIBLE>",
  "maquina_nota": "<nota màquina si cal, o buit>",
  "conf": "<ALTA|MITJA|BAIXA>",
  "why": "<una frase en castellà explicant zona + protocol + torn + màquina>"
}`;
}

export async function POST(request: NextRequest) {
  const identifier = getIdentifier(request);
  const rateLimitError = await checkRateLimit(identifier);
  if (rateLimitError) return rateLimitError;

  const validation = await validateBody(request, AnalyzeRequestSchema);
  if (!validation.success) return validation.response;

  const { text, anestesia: anestRaw } = validation.data;

  // Anestesia
  let anestesia = false;
  let anestMajor: boolean | null = null;
  if (anestRaw) {
    anestesia = true;
    const m = anestRaw.match(/(\d+)/);
    if (m) anestMajor = parseInt(m[1]) >= 3;
  }

  // ── Resolucions locals (no criden Claude) ────────────────────────────────

  if (isHifuCase(text)) {
    const p = EXCEL.find(x => x.n === 61)!;
    return NextResponse.json({ nom_protocol: p.nom, orientacio: p.ori, zona: p.zona, contrast: p.contrast, bomba: p.bomba, equip1: "RM3", equips: "RM3", huecos: p.huecos, nota: p.nota, torn: "MATI", maquina_nota: "HIFU → RM3 EXCLUSIU. SEMPRE MATI.", conf: "ALTA", why: "HIFU: RM3 exclusivo, mañana obligatorio.", raw: "Resolució local HIFU." });
  }

  if (isMeniereCase(text)) {
    const p = EXCEL.find(x => x.n === 18)!;
    return NextResponse.json({ nom_protocol: p.nom, orientacio: p.ori, zona: p.zona, contrast: p.contrast, bomba: p.bomba, equip1: "RM3", equips: "RM3", huecos: p.huecos, nota: p.nota, torn: "MATI", maquina_nota: "Menière → RM3 EXCLUSIU. 2 huecos. MATI 8-13h.", conf: "ALTA", why: "Menière: RM3 exclusivo, 2 huecos, mañana 8-13h obligatorio.", raw: "Resolució local Menière." });
  }

  if (isCartCase(text)) {
    const p = EXCEL.find(x => x.n === 65)!;
    const torn = anestesia ? (anestMajor === false ? "DIVENDRES_MATI" : anestMajor === true ? "DIMARTS_TARDA" : "ANESTESIA") : "FLEXIBLE";
    return NextResponse.json({ nom_protocol: p.nom, orientacio: p.ori, zona: p.zona, contrast: p.contrast, bomba: p.bomba, equip1: "RM3", equips: "RM3", huecos: p.huecos, nota: p.nota, torn, maquina_nota: "CAR-T → RM3 sempre.", conf: "ALTA", why: "CAR-T: RM3 siempre.", raw: "Resolució local CAR-T." });
  }

  if (isEspectroscopia(text)) {
    const p = EXCEL.find(x => x.n === 64)!;
    return NextResponse.json({ nom_protocol: p.nom, orientacio: p.ori, zona: p.zona, contrast: p.contrast, bomba: p.bomba, equip1: "RM3", equips: "RM3", huecos: p.huecos, nota: p.nota, torn: "MATI", maquina_nota: "Espectroscopia → RM3. SEMPRE MATI. Avisar radióleg.", conf: "ALTA", why: "Espectroscopia cerebral: RM3, mañana, avisar radiólogo.", raw: "Resolució local Espectroscopia." });
  }

  if (isPerfuDifu(text) && !text.toLowerCase().includes("columna") && !text.toLowerCase().includes("lumbar")) {
    const p = EXCEL.find(x => x.n === 66)!;
    return NextResponse.json({ nom_protocol: p.nom, orientacio: p.ori, zona: p.zona, contrast: p.contrast, bomba: p.bomba, equip1: "RM3", equips: "RM3/RM2/RM1", huecos: p.huecos, nota: p.nota, torn: "FLEXIBLE", maquina_nota: "PERFU/DIFU → sempre contrast+bomba. MAI RM5.", conf: "ALTA", why: "Perfusión/difusión cerebral: contraste+bomba obligatorio, nunca RM5.", raw: "Resolució local PERFU/DIFU." });
  }

  if (isFetal(text)) {
    const p = EXCEL.find(x => x.n === 46)!;
    return NextResponse.json({ nom_protocol: p.nom, orientacio: p.ori, zona: p.zona, contrast: p.contrast, bomba: p.bomba, equip1: "RM2", equips: "RM2", huecos: p.huecos, nota: p.nota, torn: "DIMARTS_TARDA", maquina_nota: "Fetal → RM2 EXCLUSIU. DIMARTS TARDA.", conf: "ALTA", why: "RM fetal cranial: RM2 exclusivo, martes tarde siempre.", raw: "Resolució local FETAL." });
  }

  if (isAnestesia(text) || anestesia) {
    const p = EXCEL.find(x => x.n === 63)!;
    const torn = anestMajor === false ? "DIVENDRES_MATI" : anestMajor === true ? "DIMARTS_TARDA" : "ANESTESIA";
    return NextResponse.json({ nom_protocol: p.nom, orientacio: p.ori, zona: p.zona, contrast: p.contrast, bomba: p.bomba, equip1: "RM1", equips: "RM1", huecos: p.huecos, nota: p.nota, torn, maquina_nota: "Anestesia → RM1 EXCLUSIU. <3a: divendres matí. ≥3a: dimarts tarda.", conf: "ALTA", why: "Anestesia pediátrica: RM1 exclusivo.", raw: "Resolució local ANESTESIA." });
  }

  // ── Llamada a Claude ──────────────────────────────────────────────────────

  let claudeRaw = "";
  try {
    const { ANTHROPIC_API_KEY } = getServerEnv();
    let resp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 200, messages: [{ role: "user", content: buildPrompt(text) }] }),
    });

    if (resp.status === 529 || resp.status === 503 || resp.status === 500) {
      resp = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 200, messages: [{ role: "user", content: buildPrompt(text) }] }),
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
      zona: "indeterminada", contrast: "DEPENDE", bomba: "DEPENDE",
      equip1: "RM3", equips: "RM3", huecos: "1",
      nota: "Requiere revisión manual.",
      torn: "FLEXIBLE", maquina_nota: "", conf: "BAIXA",
      why: "La entrada no encaja con un protocolo conocido o la respuesta del modelo no fue parseable.",
      raw: claudeRaw,
    });
  }

  const protocol = EXCEL[Math.max(0, parsed.n - 1)] ?? EXCEL[0];
  const { equip1, equips } = resolveEquip(text, protocol.nom, protocol.equip);

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
