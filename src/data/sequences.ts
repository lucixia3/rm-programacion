/**
 * Mapeig entre noms de protocols del Protocolos.xlsx i números de protocol EXCEL (1-66).
 * També inclou un índex de seqüències distintives → context clínic.
 * Generat a partir de Protocolos.xlsx (RM1/RM2/RM3/RM5).
 */

// ── Mapeig nom protocol Excel → número protocol (1-66) ───────────────────────
// Patró (regex) per detectar a la nota + número(s) de protocol corresponent
export const PROTOCOL_NAME_MAP: Array<{ re: RegExp; n: number[]; hint: string }> = [
  // NEURO - CRANI
  { re: /\bcraneo[\s_-]?estand[ae]r?d?\b/i,        n: [6],     hint: "CRANEO ESTANDARD → protocol 6 (ST simple, preferent RM4/RM5)" },
  { re: /\bictus\b|\bstroke\b/i,                    n: [14,15], hint: "ICTUS → protocols 14/15 (RM ICTUS, preferent RM5/RM3)" },
  { re: /\bpares[\s_-]?craneales?\b/i,              n: [6],     hint: "PARES CRANEALES → protocol 6 o 7 zona neuro cranial" },
  { re: /\borbitas?\b|\b[oò]rbites?\b/i,            n: [19],    hint: "ORBITES → protocol 19" },
  { re: /\bhipofisis\b|\bhip[oò]fisi\b/i,           n: [16],    hint: "HIPOFISIS → protocol 16 (MAI RM4/RM5)" },
  { re: /\bepileps[íi]a?\b/i,                       n: [10],    hint: "EPILEPSIA → protocol 10 (preferent RM3/RM2)" },
  { re: /\bcai[\s_-]?gado\b|\bcai[\s_-]?gadolini\b/i, n: [17], hint: "CAI GADO → protocol 17 (amb contrast, MAI RM5)" },
  { re: /\bcai[\s_-]?colesteatoma\b/i,              n: [17],    hint: "CAI COLESTEATOMA → protocol 17 (MAI RM4/RM5)" },
  { re: /\bimplant[e]?[\s_-]?coclear\b/i,           n: [17],    hint: "IMPLANTE COCLEAR → protocol 17" },
  { re: /\bcai[\s_-]?estand[ae]r?d?\b/i,            n: [17],    hint: "CAI ESTANDARD → protocol 17 (MAI RM5)" },
  { re: /\bcara[\s_-]?senos?\b/i,                   n: [21],    hint: "CARA SENOS → protocol 21" },
  { re: /\bcraneo[\s_-]?tumor[\s_-]?dti\b/i,        n: [3],     hint: "CRANEO TUMOR DTI → protocol 3 (RM3/RM2, bomba, neuronavegador)" },
  { re: /\btrombosi[\s]?venosa\b|\btrombosis[\s]?venosa\b/i, n:[15], hint:"TROMBOSIS VENOSA → protocol 15 (3D PCA SINUS)" },
  { re: /\bfetal[\s_-]?crani\b/i,                   n: [46],    hint: "FETAL CRANI → protocol 46 (RM2 EXCLUSIU, dimarts tarda 15h)" },
  { re: /\bfetal[\s_-]?[uú]tero?\b|\bfetal[\s_-]?mare\b/i, n:[46], hint:"FETAL ÚTER → protocol 46 (RM2 EXCLUSIU)" },
  { re: /\bdbs[\s_-]?3t\b/i,                        n: [8],     hint: "DBS 3T → protocol 8 (RM3 exclusiu)" },
  { re: /\bdbs[\s_-]?1\.?5t?\b/i,                   n: [9],     hint: "DBS 1.5T → protocol 9 (RM5 exclusiu)" },
  { re: /\batm\b|\btemporomandibular\b/i,            n: [20],    hint: "ATM → protocol 20" },
  { re: /\bmen[ié]re\b/i,                            n: [18],    hint: "MENIÈRE → protocol 18 (RM3 EXCLUSIU, 2 huecos, MATÍ 8-13h)" },
  { re: /\bparkinson[\s_-]?preecp\b|\bpre[\s_-]?ecp\b/i, n:[7], hint:"PARKINSON preECP → protocol 7 (RM3 exclusiu)" },
  { re: /\bcar[\s_-]?t\b|\bcart\b|\bcell[\s_-]?t\b/i, n:[65],  hint: "CAR-T → protocol 65 (RM3 sempre)" },
  { re: /\bea[\s_-]?descartar[\s_-]?aria\b|\baria\b/i, n:[6],   hint: "EA ARIA → protocol neuro amb seqüències específiques EA (RM2/RM3)" },
  { re: /\bdissecci[oó][\s_-]?carot[íi]da\b/i,      n: [1],     hint: "DISSECCIÓ CARÒTIDA → protocol 1 (TSA, RM2/RM3)" },
  { re: /\bmalformaci[oó][\s_-]?vascular\b/i,        n: [15],    hint: "MALFORMACIÓ VASCULAR → angio (RM2/RM3, 4D TRANCE)" },
  // CUELLO
  { re: /\bpar[oò]tida\b/i,                          n: [22],    hint: "PARÒTIDA → protocol 22 (orofaringe/salival)" },
  { re: /\bcoll[\s_-]?std\b|\bcuello[\s_-]?std\b/i, n: [23],    hint: "CUELLO STD → protocol 23" },
  // COLUMNA
  { re: /\bcervical[\s_-]?dorsal\b|\bdorsal[\s_-]?cervical\b/i, n:[26], hint:"CERVICO-DORSAL → protocol 26 (1 hueco; si RM4: 2 huecos)" },
  { re: /\bcolumna[\s_-]?completa\b|\bmedular[\s_-]?completa\b|\btoda[\s_-]?columna\b/i, n:[29], hint:"COLUMNA COMPLETA → protocol 29 (2 huecos, RM3>RM2)" },
  { re: /\bplexo[\s_-]?braquial\b/i,                 n: [29],    hint: "PLEXO → protocol columna/plexo (RM3/RM2)" },
  // ABDOMEN
  { re: /\bprimovist\b|\bmultihance\b/i,              n: [32],    hint: "PRIMOVIST/MULTIHANCE → protocol 32 (fetge, 2 huecos, bomba)" },
  { re: /\bnicofib\b/i,                               n: [33],    hint: "NICOFIB → protocol 33 (fetge, RM2/RM3)" },
  { re: /\bcolangio[\s_-]?contrast\b|\bcolangio[\s_-]?\+c\b/i, n:[34], hint:"COLANGIO+C → protocol 34" },
  { re: /\bcolangio[\s_-]?sense\b|\bcolangio[\s_-]?simple\b|\bcprm\b/i, n:[35], hint:"COLANGIO SENSE CONTRAST → protocol 35" },
  { re: /\bpancrees\b|\bpáncreas\b/i,                 n: [36],    hint: "PANCREAS → protocol 36" },
  { re: /\bsuprarenal\b|\bsuprarrenal\b/i,            n: [39],    hint: "SUPRARENALS → protocol 39 (bomba)" },
  { re: /\bquantificaci[oó][\s_-]?ferro\b|\bhierro[\s_-]?hep[aà]tic\b/i, n:[31], hint:"FERRO HEPÀTIC → protocol 31 (MATÍ, RM5/RM4)" },
  // PELVIS
  { re: /\bmioma[\s_-]?pre[\s_-]?embolitzaci[oó]\b/i, n:[40],   hint: "MIOMA PREEMBOLITZACIÓ → protocol 40 (pelvis femenina, bomba)" },
  { re: /\bmioma[\s_-]?at[ií]pic\b/i,                 n: [40],   hint: "MIOMA ATÍPIC → protocol 40 (pelvis femenina)" },
  { re: /\bendometriosi\b/i,                           n: [41],    hint: "ENDOMETRIOSI → protocol 41 (sense contrast)" },
  { re: /\bneo[\s_-]?cervix\b|\bneopl[aà]sia[\s_-]?cervix\b/i, n:[42], hint:"NEO CERVIX → protocol 42 (MATÍ, avisar radióleg)" },
  { re: /\bf[ií]stula[\s_-]?perianal\b/i,             n: [43],    hint: "FÍSTULA PERIANAL → protocol 43 (pròstata/pelvis masculina)" },
  { re: /\brecte\b|\brecto\b|\bterra[\s_-]?pelvis\b|\bsuelo[\s_-]?p[eè]lvic\b/i, n:[44], hint:"RECTE/TERRA PELVIS → protocol 44" },
  { re: /\bdefecografi[ae]\b|\bdefeco\b/i,             n: [45],    hint: "DEFECOGRAFIA → protocol 45 (MATÍ, MAI RM4)" },
  // MSK
  { re: /\bartro[\s_-]?rm\b|\bartrografi[ae]\b/i,     n: [48],    hint: "ARTRO-RM → protocol 48 (RM1 EXCLUSIU)" },
  { re: /\bespatlla\b|\bhombro\b/i,                    n: [49],    hint: "ESPATLLA → protocol 49 (RM4>RM1>RM5)" },
  { re: /\bgenoll\b|\brodilla\b/i,                     n: [50],    hint: "GENOLL → protocol 50 (RM4>RM5>RM1)" },
  { re: /\bmaluc\b|\bcadera\b/i,                       n: [51],    hint: "MALUC/CADERA → protocol 51 (RM4>RM1>RM5)" },
  { re: /\bturmell\b|\btobillo\b|\bpeu\b|\bpie\b|\btal[oó]\b|\btal[oó]n\b/i, n:[52], hint:"TURMELL/PEU → protocol 52 (RM4>RM5>RM1)" },
  { re: /\bm[aà][\s_-]?canell\b|\bmu[nñ]eca\b|\bdits\b|\bdedos\b/i, n:[53], hint:"MÀ/CANELL → protocol 53 (3T obligatori: RM3>RM2)" },
  { re: /\bcolze\b|\bcodo\b|\bepicondil\b/i,           n: [54],    hint: "COLZE → protocol 54 (RM5>RM4>RM1)" },
  { re: /\bsacroil[íi][aà]ques?\b|\bsacroiliacas?\b/i, n:[55],   hint: "SACROILÍAQUES → protocol 55" },
  { re: /\bpubalgia\b/i,                               n: [56],    hint: "PUBALGIA/PELVIS MSK → protocol 56" },
  { re: /\btumor[\s_-]?extremitat\b|\btumor[\s_-]?extremidad\b/i, n:[47], hint:"TUMOR EXTREMITAT → protocol 47 (MSK tumor)" },
  { re: /\belastofibroma\b/i,                          n: [57],    hint: "ELASTOFIBROMA → protocol 57 (tòrax)" },
  { re: /\bestrecho[\s_-]?tor[aà]cic\b|\bplexo[\s_-]?braquial\b/i, n:[57], hint:"ESTRECHO TORÀCIC → tòrax/plexo" },
  { re: /\bsarcoma\b/i,                                n: [47],    hint: "SARCOMA → protocol 47 (tumor extremitat/pelvis)" },
  // MAMA
  { re: /\bmama[\s_-]?din[aà]mic\b|\bmama[\s_-]?diagn[oò]stic\b/i, n:[58], hint:"MAMA DINÀMIC → protocol 58 (contrast+bomba, 1 antena)" },
  { re: /\bprotesi[\s_-]?mam[aà]ri\b|\bimplant[\s_-]?mam[aà]ri\b/i, n:[59], hint:"PROTESI MAMARIA → protocol 59" },
  // TOTAL BODY
  { re: /\btotal[\s_-]?body\b|\bcos[\s_-]?sencer\b|\bcuerpo[\s_-]?entero\b|\blimfoma\b|\blinfoma\b/i, n:[60], hint:"TOTAL BODY/LIMFOMA → protocol 60 (RM1/RM5)" },
  // ESPECIALS
  { re: /\bhifu\b|\bultrasons[\s_-]?focalitzats\b/i,   n: [61],   hint: "HIFU → protocol 61 (RM3 EXCLUSIU, MATÍ, sessió sencera)" },
  { re: /\bcardio\b|\bcardiopatia\b/i,                  n: [62],   hint: "CARDIO → protocol 62 (RM2>RM5, MAI RM3/RM4)" },
  { re: /\bespectroscopi[ae]\b|\bespectro\b|\bspectro\b/i, n:[64], hint:"ESPECTROSCOPIA → protocol 64 (RM3, MATÍ, avisar radióleg)" },
  { re: /\bpediatri[ae]\b|\banest[eè]sia\b|\bsedaci[oó]\b/i, n:[63], hint:"PEDIATRIA/ANESTESIA → protocol 63 (RM1 EXCLUSIU)" },
  { re: /\bdlab[\s_-]?3d\b/i,                           n: [53],   hint: "DLAB 3D → protocol MSK avançat 3T (RM3/RM2)" },
  { re: /\bangio[\s_-]?sense[\s_-]?contrast\b/i,        n: [14],   hint: "ANGIO SENSE CONTRAST → protocol 14 (TOF/Willis)" },
  { re: /\bmioma[\s_-]?preembolizaci[oó]n?\b/i,         n: [40],   hint: "MIOMA PREEMBOLIZACIÓN → protocol 40 (pelvis femenina, bomba)" },
];

// ── Seqüències MRI distintives → context clínic ──────────────────────────────
// Seqüències que poden aparèixer a la nota i ajuden a identificar el protocol
export const DISTINCTIVE_SEQUENCES: Array<{ re: RegExp; hint: string }> = [
  { re: /\b3d[\s_-]?flair[\s_-]?meni[eè]re\b|\b3d[\s_-]?ir[\s_-]?meni[eè]re\b/i,
    hint: "Seqüència MENIÈRE detectada → protocol 18 (RM3 EXCLUSIU, 2 huecos, MATÍ 8-13h)" },
  { re: /\bbtfe\b/i,
    hint: "Seqüència BTFE detectada → protocol fetal (46: RM2 EXCLUSIU, dimarts tarda)" },
  { re: /\b(?:ss[\s_-]?sag|ss[\s_-]?tra|ss[\s_-]?cor)\b/i,
    hint: "Seqüència SS (steady state) → protocol fetal cranial (46: RM2 EXCLUSIU)" },
  { re: /\b(?:3d[\s_-]?mrcp|mrcp[\s_-]?radial)\b/i,
    hint: "Seqüència MRCP detectada → protocol colangio (34/35)" },
  { re: /\bthrive[\s_-]?dinamic\b/i,
    hint: "Seqüència THRIVE dinàmic → abdomen/mama dinàmic (protocol 30/32/58)" },
  { re: /\b4d[\s_-]?trance\b/i,
    hint: "Seqüència 4D TRANCE → malformació vascular cerebral (RM2)" },
  { re: /\bangio[\s_-]?post[\s_-]?gd\b/i,
    hint: "Seqüència angio post-Gd → malformació vascular (RM2/RM3)" },
  { re: /\b(?:sv[\s_-]?press|2d[\s_-]?press[\s_-]?144|spectro[\s_-]?single[\s_-]?voxel)\b/i,
    hint: "Seqüència SPECTROSCOPIA detectada → protocol 64 (RM3, MATÍ, avisar radióleg)" },
  { re: /\bneuronavegador\b/i,
    hint: "Seqüència Neuronavegador → tumor cerebral DBS (protocol 3/8)" },
  { re: /\b3d[\s_-]?pca[\s_-]?sinus\b/i,
    hint: "Seqüència 3D PCA SINUS → trombosi venosa sinusal (protocol 15)" },
  { re: /\b3d[\s_-]?tof\b/i,
    hint: "Seqüència 3D TOF → angio Willis/ictus (protocol 14/15)" },
  { re: /\bdti\b/i,
    hint: "Seqüència DTI → tumor cerebral o DBS (protocol 3/8)" },
  { re: /\b3d[\s_-]?brainview[\s_-]?(?:flair|dir)\b/i,
    hint: "Seqüència 3D BrainVIEW → CAI colesteatoma o EM (protocol 17/4)" },
  { re: /\bprimovist\b|\b3d[\s_-]?dinamico[\s_-]?dixon\b/i,
    hint: "Seqüència Primovist dinàmic → protocol 32 (fetge Primovist, 2 huecos, bomba)" },
  { re: /\b3d[\s_-]?wats\b/i,
    hint: "Seqüència 3D WATS → MSK cadera (RM2/RM3)" },
  { re: /\b3d[\s_-]?stir[\s_-]?cor\b/i,
    hint: "Seqüència 3D STIR Cor → plexo braquial (tòrax, RM1)" },
  { re: /\bfe[\s_-]?epi\b/i,
    hint: "Seqüència FE EPI → tumor cerebral perfusió (protocol 3/66, RM3)" },
  { re: /\b3d[\s_-]?pdw[\s_-]?hr\b|\bdlab[\s_-]?3d\b/i,
    hint: "Seqüències DLAB 3D → MSK avançat 3T (RM3/RM2, protocol 53)" },
  { re: /\b3d[\s_-]?brainview[\s_-]?flair[\s_-]?sag\b/i,
    hint: "Seqüència EA ARIA → protocol EA descartar ARIA (RM2/RM3)" },
];

/**
 * Escanya el text de la nota i retorna les pistes de protocol/seqüència trobades.
 * S'utilitza per enriquir el missatge d'usuari a Claude amb context addicional.
 */
export function detectSequenceHints(text: string): string {
  const found: string[] = [];

  for (const { re, hint } of PROTOCOL_NAME_MAP) {
    if (re.test(text)) {
      found.push(`[PROTOCOL DETECTAT: ${hint}]`);
    }
  }

  for (const { re, hint } of DISTINCTIVE_SEQUENCES) {
    if (re.test(text)) {
      found.push(`[SEQÜÈNCIA DETECTADA: ${hint}]`);
    }
  }

  if (!found.length) return "";
  return "\n" + found.join("\n");
}
