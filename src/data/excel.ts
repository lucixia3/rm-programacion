/**
 * Datos de protocolos de RM extraídos del Excel chuleta_rm_2.xlsx (RM TOT).
 * Fuente: Hospital de Sant Pau. Datos reales dic.2025–feb.2026 (5.370 registros).
 * Este archivo solo se usa en el servidor (route handlers).
 * Última sincronización con Excel: mar.2026
 */
export interface Protocol {
  n: number;
  nom: string;
  ori: string;
  zona: string;
  contrast: "SI" | "NO" | "DEPENDE";
  bomba: "SI" | "NO" | "DEPENDE";
  equip: string;
  huecos: string;
  nota: string | null;
}

export const EXCEL: Protocol[] = [
  // ── NEUROCRANIAL ──────────────────────────────────────────────────────────
  {n:1, nom:"RM ANGIO TSA",                          ori:"Enf. Takayasu / afectació TSA (subclàvia)",                              zona:"neuro TSA cabeza cuello",              contrast:"SI",      bomba:"SI",      equip:"RM2/RM3/RM1/RM4",      huecos:"1",            nota:null},
  {n:2, nom:"RM DE CERVELL AMB CONTRAST",            ori:"ST + contrast",                                                          zona:"neuro cerebro",                        contrast:"SI",      bomba:"NO",      equip:"RM5/RM1/RM4/RM2/RM3",  huecos:"1",            nota:null},
  {n:3, nom:"RM DE CERVELL AMB CONTRAST",            ori:"Protocol tumor / seguiment",                                             zona:"neuro cerebro tumor",                  contrast:"SI",      bomba:"SI",      equip:"RM3/RM2/RM1/RM4",      huecos:"1",            nota:"Elucirem (T1 SE)"},
  {n:4, nom:"RM DE CERVELL AMB CONTRAST",            ori:"EM Debut (Esclerosi Múltiple debut)",                                    zona:"neuro cerebro EM",                     contrast:"SI",      bomba:"NO",      equip:"RM2/RM3/RM5/RM1/RM4",  huecos:"1",            nota:null},
  {n:5, nom:"RM DE CERVELL AMB CONTRAST",            ori:"EM Brot (brote esclerosi múltiple)",                                     zona:"neuro cerebro EM",                     contrast:"SI",      bomba:"NO",      equip:"RM2/RM3/RM5/RM1/RM4",  huecos:"1",            nota:null},
  {n:6, nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"ST estàndard",                                                           zona:"neuro cerebro",                        contrast:"NO",      bomba:"NO",      equip:"RM5/RM1/RM4/RM2/RM3",  huecos:"1",            nota:"ST simple: preferent RM4/RM5, alliberar RM2/RM3"},
  {n:7, nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"Parkinson preECP",                                                       zona:"neuro cerebro parkinson",              contrast:"NO",      bomba:"NO",      equip:"RM3",                  huecos:"1",            nota:"RM3 exclusiu"},
  {n:8, nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"DBS 3T",                                                                 zona:"neuro cerebro DBS",                    contrast:"NO",      bomba:"NO",      equip:"RM3",                  huecos:"1",            nota:"RM3 exclusiu"},
  {n:9, nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"DBS 1.5T",                                                               zona:"neuro cerebro DBS",                    contrast:"NO",      bomba:"NO",      equip:"RM5",                  huecos:"1",            nota:"RM5 exclusiu"},
  {n:10,nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"Epilèpsia",                                                               zona:"neuro cerebro epilepsia",              contrast:"NO",      bomba:"NO",      equip:"RM3/RM2/RM5/RM1/RM4",  huecos:"1",            nota:"Preferent RM3 o RM2"},
  {n:11,nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"Portadora DVP (derivació ventriculoperitoneal)",                         zona:"neuro cerebro DVP",                    contrast:"NO",      bomba:"NO",      equip:"RM5/RM1/RM2/RM3",      huecos:"1",            nota:null},
  {n:12,nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"Migranya aura / Narcolèpsia",                                            zona:"neuro cerebro migraña narcolepsia",    contrast:"NO",      bomba:"NO",      equip:"RM5/RM4/RM1/RM2/RM3",  huecos:"1",            nota:null},
  {n:13,nom:"RM DE CERVELL SENSE/AMB CONTRAST",      ori:"Covid (secuelas neurológicas)",                                          zona:"neuro cerebro covid",                  contrast:"NO",      bomba:"NO",      equip:"RM3/RM2",              huecos:"1",            nota:null},
  {n:14,nom:"RM CERVELL + ANGIO RM (WILLIS)",        ori:"Ictus isquèmic",                                                         zona:"neuro cerebro ictus",                  contrast:"NO",      bomba:"NO",      equip:"RM5/RM3/RM1/RM4/RM2",  huecos:"1",            nota:null},
  {n:15,nom:"RM ICTUS",                              ori:"Ictus isquèmic",                                                         zona:"neuro cerebro ictus",                  contrast:"NO",      bomba:"NO",      equip:"RM5/RM3/RM1/RM4/RM2",  huecos:"1",            nota:null},
  {n:16,nom:"RM HIPOFISI / RM HIPOFISIS AMB CONTRAST",ori:"Adenoma / Hipopituïtarisme / Hiperprolactinèmia / Macroadenoma",        zona:"neuro hipofisis",                      contrast:"SI",      bomba:"SI",      equip:"RM3/RM2/RM1/RM4",      huecos:"1",            nota:"⚠ MAI RM4 ni RM5. Perfu = contrast + bomba"},
  {n:17,nom:"RM BASE CRANI (PENYAL/CAIS)",           ori:"Schwannoma / Implant coclear / Paràlisi facial / Hipoacúsia / Acúfen",   zona:"neuro peñascos oido CAIS",             contrast:"DEPENDE", bomba:"NO",      equip:"RM2/RM1/RM4/RM3",      huecos:"1",            nota:"⚠ MAI RM5. CAIS estricte: MAI RM4 ni RM5 (solo RM1/RM2/RM3)"},
  {n:18,nom:"RM BASE CRANI (PENYAL/CAIS) — MENIÈRE", ori:"Menière",                                                                zona:"neuro peñascos oido meniere",          contrast:"SI",      bomba:"NO",      equip:"RM3",                  huecos:"2 (8-13h)",    nota:"⚠ RM3 EXCLUSIU. 2 huecos. MATI obligatori 8-13h"},
  {n:19,nom:"RM D'ÒRBITES SENSE/AMB CONTRAST",       ori:"Globus ocular / Neuropatia òptica",                                     zona:"neuro orbitas ojos",                   contrast:"SI",      bomba:"NO",      equip:"RM5/RM1/RM2/RM3/RM4",  huecos:"1",            nota:null},
  {n:20,nom:"RM ATM",                                ori:"Articulació temporomandibular",                                          zona:"neuro ATM mandibula",                  contrast:"NO",      bomba:"NO",      equip:"RM1/RM5/RM2/RM3",      huecos:"1",            nota:null},
  {n:21,nom:"RM DE CARA / SINS SENSE/AMB CONTRAST",  ori:"Papiloma fosa nasal / patologia facial",                                 zona:"neuro cara senos nasales",             contrast:"SI",      bomba:"NO",      equip:"RM2/RM3/RM5/RM1/RM4",  huecos:"1",            nota:null},
  {n:22,nom:"RM D'OROFARINGE SENSE/AMB CONTRAST",    ori:"Tumor submucosa mandíbula / Glàndula salival",                           zona:"neuro orofaringe faringe",             contrast:"SI",      bomba:"DEPENDE", equip:"RM2/RM3/RM5/RM1/RM4",  huecos:"1",            nota:null},
  {n:23,nom:"RM DE COLL / LARINGE SENSE/AMB CONTRAST",ori:"Coll amb contrast / Laringe",                                          zona:"neuro cuello laringe",                 contrast:"SI",      bomba:"SI",      equip:"RM2/RM3/RM5/RM1/RM4",  huecos:"1",            nota:null},

  // ── COLUMNA VERTEBRAL ─────────────────────────────────────────────────────
  {n:24,nom:"RM COL. CERVICAL AMB CONTRAST",         ori:"Mielopatia / Enf. desmielinitzant",                                     zona:"columna cervical",                     contrast:"DEPENDE", bomba:"NO",      equip:"RM5/RM2/RM3/RM4/RM1",  huecos:"1",            nota:null},
  {n:25,nom:"RM COL. CERVICAL SENSE CONTRAST",       ori:"Cervicalgia / parestèsia / vertigen",                                   zona:"columna cervical",                     contrast:"NO",      bomba:"NO",      equip:"RM5/RM4/RM1/RM2/RM3",  huecos:"1",            nota:null},
  {n:26,nom:"RM CERVICO-DORSAL SENSE CONTRAST",      ori:"Compressió medul·lar / Cervicalgia + Dorsalgia",                        zona:"columna cervico-dorsal",               contrast:"NO",      bomba:"NO",      equip:"RM1/RM5/RM2/RM3/RM4",  huecos:"1",            nota:"⚠ Si RM4: 2 huecos"},
  {n:27,nom:"RM COL. DORSAL SENSE/AMB CONTRAST",     ori:"Dolorsàlgia / Fractures / Tumor dorsal / Enf. desmielinitzant",         zona:"columna dorsal",                       contrast:"DEPENDE", bomba:"NO",      equip:"RM1/RM5/RM2/RM3/RM4",  huecos:"1",            nota:null},
  {n:28,nom:"RM COL. LUMBAR SENSE CONTRAST",         ori:"Lumbalgia / Lumbociàtica / Fractures / Lesió radicular / Estenosi canal",zona:"columna lumbar",                       contrast:"NO",      bomba:"NO",      equip:"RM5/RM4/RM1/RM2/RM3",  huecos:"1",            nota:null},
  {n:29,nom:"RM MEDULAR / RM COLUMNA COMPLETA",      ori:"Enf. desmielinitzant SNC / Compressió medul·lar",                       zona:"columna medular completa",             contrast:"DEPENDE", bomba:"NO",      equip:"RM3/RM2/RM5/RM1/RM4",  huecos:"2",            nota:"⚠ 2 huecos. RM3>RM2"},

  // ── ABDOMEN ───────────────────────────────────────────────────────────────
  {n:30,nom:"RM FETGE / ABDOMEN AMB CONTRAST",       ori:"Hígado amb contrast",                                                   zona:"abdomen higado",                       contrast:"SI",      bomba:"SI",      equip:"RM3/RM2/RM1/RM4",      huecos:"1",            nota:null},
  {n:31,nom:"RM FETGE / ABDOMEN AMB CONTRAST",       ori:"Hígado Quantificació Ferro",                                            zona:"abdomen higado hierro",                contrast:"NO",      bomba:"NO",      equip:"RM5/RM4",              huecos:"1",            nota:"⚠ SEMPRE MATI. Ferro ja no es fa a RM1"},
  {n:32,nom:"RM FETGE / ABDOMEN AMB CONTRAST",       ori:"Hígado Multihance / Primovist",                                         zona:"abdomen higado multihance primovist",  contrast:"SI",      bomba:"SI",      equip:"RM3/RM2/RM1/RM4",      huecos:"2",            nota:"⚠ 2 huecos"},
  {n:33,nom:"RM FETGE / ABDOMEN AMB CONTRAST",       ori:"Nicofib",                                                               zona:"abdomen higado nicofib",               contrast:"NO",      bomba:"NO",      equip:"RM2/RM3",              huecos:"1",            nota:null},
  {n:34,nom:"COLANGIO RM + FETGE AMB CONTRAST",      ori:"Colangio + hígado amb contrast",                                        zona:"abdomen vias biliares colangio higado",contrast:"SI",      bomba:"SI",      equip:"RM1/RM5/RM2/RM3",      huecos:"1",            nota:"Si porta +VER: MATI obligatori"},
  {n:35,nom:"COLANGIO RM SENSE CONTRAST",            ori:"Colangio simple",                                                       zona:"abdomen vias biliares colangio",       contrast:"NO",      bomba:"NO",      equip:"RM5/RM4/RM1/RM2",      huecos:"1",            nota:null},
  {n:36,nom:"RM PANCREES AMB CONTRAST",              ori:"Pàncrees amb contrast / Fetge per estudi pàncrees",                     zona:"abdomen pancreas",                     contrast:"DEPENDE", bomba:"NO",      equip:"RM5/RM3/RM2",          huecos:"1",            nota:null},
  {n:37,nom:"ENTERO-RM",                             ori:"Crohn / EII (Enf. Inflamatòria Intestinal)",                            zona:"abdomen intestino crohn EII",          contrast:"SI",      bomba:"SI",      equip:"RM2/RM1/RM3",          huecos:"1",            nota:"⚠ SEMPRE MATI (100% dades reals)"},
  {n:38,nom:"RM RENAL AMB CONTRAST",                 ori:"Patologia renal",                                                       zona:"abdomen renal rinyó",                  contrast:"SI",      bomba:"SI",      equip:"RM2/RM3",              huecos:"1",            nota:"⚠ SEMPRE MATI (100% dades reals)"},
  {n:39,nom:"RM SUPRARENALS AMB CONTRAST",           ori:"Suprarenals",                                                           zona:"abdomen suprarrenales",                contrast:"DEPENDE", bomba:"SI",      equip:"RM2/RM3/RM1/RM4",      huecos:"1",            nota:null},

  // ── PELVIS ────────────────────────────────────────────────────────────────
  {n:40,nom:"RM PELVIS FEMENINA",                    ori:"Mioma / Pelvis femenina / Neo Endometri",                               zona:"pelvis utero mioma endometri",         contrast:"SI",      bomba:"SI",      equip:"RM5/RM2/RM3/RM1",      huecos:"1",            nota:null},
  {n:41,nom:"RM PELVIS FEMENINA",                    ori:"Endometriosi",                                                          zona:"pelvis endometriosis",                 contrast:"NO",      bomba:"NO",      equip:"RM5/RM2/RM3",          huecos:"1",            nota:null},
  {n:42,nom:"RM PELVIS FEMENINA",                    ori:"Neo Cervix",                                                            zona:"pelvis cervix neo",                    contrast:"DEPENDE", bomba:"NO",      equip:"RM2/RM3/RM5",          huecos:"1",            nota:"⚠ Avisar radióleg. MATI obligatori"},
  {n:43,nom:"RM PELVIS MASCULINA / PRÒSTATA",        ori:"Pròstata / Fístula perianal",                                           zona:"pelvis prostata fistula",              contrast:"SI",      bomba:"SI",      equip:"RM3/RM2/RM4",          huecos:"1",            nota:null},
  {n:44,nom:"RM RECTE / TERRA PELVIS",               ori:"Recte / terra pelvis",                                                  zona:"pelvis recto suelo pelvico",           contrast:"NO",      bomba:"NO",      equip:"RM2/RM3/RM1",          huecos:"1",            nota:null},
  {n:45,nom:"RM DEFECOGRAFIA",                       ori:"Defecografia",                                                          zona:"pelvis suelo pelvico defeco",          contrast:"NO",      bomba:"NO",      equip:"RM1/RM2",              huecos:"1",            nota:"⚠ SEMPRE MATI. NO RM4"},
  {n:46,nom:"RM FETAL CRANI",                        ori:"RM fetal cranial",                                                      zona:"fetal craneo",                         contrast:"NO",      bomba:"NO",      equip:"RM2",                  huecos:"1",            nota:"⚠ RM2 EXCLUSIU. DIMARTS TARDA a partir de les 15h. Dra. Gomez Chiari present"},

  // ── MSK (MUSCULOESQUELÉTICO) ──────────────────────────────────────────────
  {n:47,nom:"RM PELVIS / EXTREMITAT (TUMOR)",        ori:"Protocol tumor extremitat / pelvis MSK",                                zona:"msk tumor extremidad pelvis",          contrast:"SI",      bomba:"NO",      equip:"RM1/RM4/RM5",          huecos:"1",            nota:null},
  {n:48,nom:"ARTRO-RM ESPATLLA / MALUC",             ori:"Artrografia espatlla / maluc",                                          zona:"msk artro hombro cadera",              contrast:"NO",      bomba:"NO",      equip:"RM1",                  huecos:"1",            nota:"⚠ RM1 EXCLUSIU (100% dades reals)"},
  {n:49,nom:"RM ESPATLLA",                           ori:"Espatlla estàndard",                                                    zona:"msk hombro",                           contrast:"NO",      bomba:"NO",      equip:"RM4/RM1/RM5",          huecos:"1",            nota:null},
  {n:50,nom:"RM GENOLL",                             ori:"Menisc / LCA / patologia genoll",                                      zona:"msk rodilla",                          contrast:"NO",      bomba:"NO",      equip:"RM4/RM5/RM1",          huecos:"1",            nota:null},
  {n:51,nom:"RM MALUC",                              ori:"Patologia maluc",                                                       zona:"msk cadera",                           contrast:"NO",      bomba:"NO",      equip:"RM4/RM1/RM5",          huecos:"1",            nota:null},
  {n:52,nom:"RM TURMELL / PEU",                      ori:"Turmell / peu / taló",                                                  zona:"msk tobillo pie talon",                contrast:"NO",      bomba:"NO",      equip:"RM4/RM5/RM1",          huecos:"1",            nota:null},
  {n:53,nom:"RM MÀ / CANELL",                        ori:"Mà / canell / dits",                                                    zona:"msk mano muñeca dedos",                contrast:"NO",      bomba:"NO",      equip:"RM3/RM2",              huecos:"1",            nota:"⚠ 3T obligatori (RM3>RM2). MAI RM1/RM4/RM5"},
  {n:54,nom:"RM COLZE",                              ori:"Colze / epicondilitis",                                                  zona:"msk codo epicondilitis",               contrast:"NO",      bomba:"NO",      equip:"RM5/RM4/RM1",          huecos:"1",            nota:null},
  {n:55,nom:"RM SACROILÍAQUES",                      ori:"Articulacions sacroilíaques",                                           zona:"msk sacroiliacas",                     contrast:"NO",      bomba:"NO",      equip:"RM5/RM4/RM1",          huecos:"1",            nota:null},
  {n:56,nom:"RM PELVIS MUSCULO-ESQUELÈTICA",         ori:"Pelvis MSK / pubalgia",                                                 zona:"msk pelvis musculoesqueletica pubalgia",contrast:"NO",    bomba:"NO",      equip:"RM1/RM4/RM5",          huecos:"1",            nota:null},

  // ── TÓRAX / MAMA ─────────────────────────────────────────────────────────
  {n:57,nom:"RM TÒRAX SENSE CONTRAST",               ori:"Tumor / patologia toràcica",                                            zona:"torax tumor patologia toracica",       contrast:"NO",      bomba:"NO",      equip:"RM4/RM1/RM3",          huecos:"1",            nota:null},
  {n:58,nom:"RM MAMA AMB CONTRAST",                  ori:"RM mama diagnòstica",                                                   zona:"mama cancer diagnostica",              contrast:"SI",      bomba:"SI",      equip:"RM3/RM4/RM2/RM1",      huecos:"1",            nota:"⚠ NO programar RM2 i RM3 alhora (1 sola antena de mama)"},
  {n:59,nom:"RM MAMA (PROTESI)",                     ori:"Control protesi mamaria",                                               zona:"mama protesis implante",               contrast:"DEPENDE", bomba:"NO",      equip:"RM3/RM4/RM2",          huecos:"1",            nota:"⚠ NO programar RM2 i RM3 alhora (1 sola antena de mama)"},

  // ── COS SENCER ────────────────────────────────────────────────────────────
  {n:60,nom:"RM COS SENCER (TOTAL BODY)",            ori:"Total body oncològic / limfoma",                                        zona:"cuerpo entero whole body linfoma oncologia",contrast:"NO",bomba:"NO",     equip:"RM1/RM5",              huecos:"1",            nota:null},

  // ── PROCEDIMENTS ESPECIALS / AVANÇATS ────────────────────────────────────
  {n:61,nom:"RM HIFU",                               ori:"Tractament HIFU guiat per RM",                                          zona:"intervencionisme HIFU",                contrast:"NO",      bomba:"NO",      equip:"RM3",                  huecos:"MATI",         nota:"⚠ RM3 EXCLUSIU. SEMPRE MATI. Ocupa tota la sessió de matí"},
  {n:62,nom:"RM CARDIO / CARDIOPATIA ISQUÈMICA",     ori:"Cardiopatia isquèmica / valvular / aorta",                              zona:"cardio corazon aorta",                 contrast:"SI",      bomba:"SI",      equip:"RM2/RM5",              huecos:"1",            nota:"⚠ RM2>RM5. NO RM3/RM4 normalment"},
  {n:63,nom:"ANESTESIA RADIOLOGIA",                  ori:"Pediatria amb sedació / anestèsia",                                     zona:"pediatria anestesia sedacion",         contrast:"NO",      bomba:"NO",      equip:"RM1",                  huecos:"1",            nota:"⚠ RM1 EXCLUSIU. <3a: DIVENDRES MATI. ≥3a: DIMARTS TARDA"},
  {n:64,nom:"RM ESPECTROSCOPIA",                     ori:"Espectroscopia cerebral",                                               zona:"neuro espectroscopia cerebral",         contrast:"DEPENDE", bomba:"NO",      equip:"RM3",                  huecos:"1",            nota:"⚠ RM3. SEMPRE MATI. Avisar radióleg"},
  {n:65,nom:"RM CAR-T",                              ori:"Tractament CAR-T seguiment",                                            zona:"neuro oncologia CAR-T",                contrast:"NO",      bomba:"NO",      equip:"RM3",                  huecos:"1",            nota:"⚠ RM3 sempre"},
  {n:66,nom:"RM DIFUSIÓ-PERFUSIÓ (PERFU/DIFU)",      ori:"Perfusió / difusió cerebral",                                           zona:"neuro cerebro perfusion difusion",     contrast:"SI",      bomba:"SI",      equip:"RM3/RM2/RM1",          huecos:"1",            nota:"⚠ SEMPRE contrast+bomba. MAI RM5"},
];

export function buildPromptTable(): string {
  return EXCEL.map((p) => {
    const b = p.bomba || "NO";
    const n = p.nota ? ` | NOTA: ${p.nota}` : "";
    return `${p.n}. PRESTACION:"${p.nom}" | ORIENTACION_DIAGNOSTICA:"${p.ori}" | ZONA_CORPORAL:"${p.zona}" | CONTRAST:${p.contrast} | BOMBA:${b} | EQUIPS:${p.equip} | HUECOS:${p.huecos}${n}`;
  }).join("\n");
}
