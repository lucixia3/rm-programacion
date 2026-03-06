/**
 * Datos de protocolos de RM extraídos del Excel de orientación diagnóstica.
 * Este archivo solo se usa en el servidor (route handlers).
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
  {n:1,nom:"RM ANGIO TSA",ori:"Enfermedad de Takayasu y antecedente de afectación de TSA (subclavia)",zona:"neuro TSA cabeza cuello",contrast:"SI",bomba:"SI",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:2,nom:"RM DE CERVELL AMB CONTRAST",ori:"ST más contraste",zona:"neuro cerebro",contrast:"SI",bomba:"NO",equip:"RM5/RM1/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:3,nom:"RM DE CERVELL AMB CONTRAST",ori:"Protocolo tumor/protoclo tumor seguimiento",zona:"neuro cerebro tumor",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM1/RM4",huecos:"1",nota:null},
  {n:4,nom:"RM DE CERVELL AMB CONTRAST",ori:"Protocolo esclerosis múltiple Debut",zona:"neuro cerebro EM",contrast:"SI",bomba:"NO",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:5,nom:"RM DE CERVELL AMB CONTRAST",ori:"Protocolo esclerosis múltiple Brote",zona:"neuro cerebro EM",contrast:"SI",bomba:"NO",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:6,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"ST",zona:"neuro cerebro",contrast:"NO",bomba:"NO",equip:"RM5/RM1/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:7,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Parkinson preECP",zona:"neuro cerebro parkinson",contrast:"NO",bomba:"NO",equip:"RM3",huecos:"1",nota:null},
  {n:8,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Protocolo DBS_Depre 3T",zona:"neuro cerebro DBS",contrast:"NO",bomba:"NO",equip:"RM3",huecos:"1",nota:null},
  {n:9,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Protocolo DBS_Depre 1.5T",zona:"neuro cerebro DBS",contrast:"NO",bomba:"NO",equip:"RM5",huecos:"1",nota:null},
  {n:10,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Epilèpsia",zona:"neuro cerebro epilepsia",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:11,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Portadora DVP",zona:"neuro cerebro DVP",contrast:"NO",bomba:"NO",equip:"RM5/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:12,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Migrañas con aurea",zona:"neuro cerebro migraña",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:13,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Narcolepsia con cataplejia+ migraña",zona:"neuro cerebro narcolepsia",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:14,nom:"RM DE CERVELL SENSE/AMB CONTRAST",ori:"Covid",zona:"neuro cerebro covid",contrast:"NO",bomba:"NO",equip:"RM3/RM2",huecos:"1",nota:null},
  {n:15,nom:"RM CERVELL + ANGIO RM (WILLIS)",ori:"Ictus",zona:"neuro cerebro ictus",contrast:"NO",bomba:"NO",equip:"RM5/RM3/RM1/RM4/RM2",huecos:"1",nota:null},
  {n:16,nom:"RM ICTUS",ori:"Ictus isquémico",zona:"neuro cerebro ictus",contrast:"NO",bomba:"NO",equip:"RM5/RM3/RM1/RM4/RM2",huecos:"1",nota:null},
  {n:17,nom:"RM HIPOFISI",ori:"Hipopituitarisme",zona:"neuro hipofisis",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM4/RM1",huecos:"1",nota:null},
  {n:18,nom:"RM DE HIPÒFISIS AMB CONTRAST",ori:"Adenoma hipofisiario",zona:"neuro hipofisis",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM4/RM1",huecos:"1",nota:null},
  {n:19,nom:"RM DE HIPÒFISIS AMB CONTRAST",ori:"Hiperprolactinemia",zona:"neuro hipofisis",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM4/RM1",huecos:"1",nota:null},
  {n:20,nom:"RM DE HIPÒFISIS AMB CONTRAST",ori:"Macroadenoma hipofisiario",zona:"neuro hipofisis",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM4/RM1",huecos:"1",nota:null},
  {n:21,nom:"RM DE BASE DE CRANI (PENYAL) SENSE CONTRAST",ori:"Schwannoma vestibular",zona:"neuro peñascos oido",contrast:"SI",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:22,nom:"RM DE BASE DE CRANI (PENYAL) SENSE CONTRAST",ori:"Estudio candidato implante coclear",zona:"neuro peñascos oido",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:23,nom:"RM DE BASE DE CRANI (PENYAL) SENSE CONTRAST",ori:"Paralisis facial",zona:"neuro peñascos oido",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:24,nom:"RM DE BASE DE CRANI (PENYAL) SENSE CONTRAST",ori:"Hipoacusia",zona:"neuro peñascos oido",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:25,nom:"RM DE BASE DE CRANI (PENYAL) SENSE CONTRAST",ori:"Acúfeno",zona:"neuro peñascos oido",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:26,nom:"RM DE BASE DE CRANI (PENYAL) SENSE CONTRAST",ori:"Menière",zona:"neuro peñascos oido meniere",contrast:"SI",bomba:"NO",equip:"RM3",huecos:"2 (8.00-13.00HS)",nota:"Solo se puede hacer de 8:00 a 13:00h. Ocupa 2 huecos."},
  {n:27,nom:"RM D'ÒRBITES SENSE/AMB CONTRAST",ori:"Globus ocular i musculatura extraocular",zona:"neuro orbitas ojos",contrast:"SI",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:28,nom:"RM D'ÒRBITES SENSE/AMB CONTRAST",ori:"Neuropatia óptica",zona:"neuro orbitas ojos",contrast:"SI",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:29,nom:"RM ATM",ori:"Aticulació temporomandubular",zona:"neuro ATM mandibula",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3",huecos:"1",nota:null},
  {n:30,nom:"RM DE CARA, SINS SENSE/AMB CONTRAST",ori:"Papiloma invertido en fosa nasal",zona:"neuro cara senos nasales",contrast:"SI",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:31,nom:"RM D'OROFARINGE SENSE/AMB CONTRAST",ori:"Tumoración submucosa a nivel de rama horizontal de mandíbula",zona:"neuro orofaringe faringe",contrast:"SI",bomba:"NO",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:32,nom:"RM D'OROFARINGE SENSE/AMB CONTRAST",ori:"Tumoración glándula salival",zona:"neuro orofaringe faringe",contrast:"SI",bomba:"DEPENDE",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:33,nom:"RM DE COLL SENSE/AMB CONTRAST",ori:"CUELLO",zona:"neuro cuello cervical",contrast:"SI",bomba:"SI",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:34,nom:"RM DE LARINGE",ori:"CUELLO",zona:"neuro cuello laringe",contrast:"SI",bomba:"SI",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:35,nom:"RM DE COLUMNA CERVICAL  AMB CONTRAST",ori:"Hemiparesia e hemihipoestesia. Descatar mielopatia cervical",zona:"columna cervical",contrast:"NO",bomba:"NO",equip:"RM5/RM2/RM3/RM4/RM1",huecos:"1",nota:null},
  {n:36,nom:"RM DE COLUMNA CERVICAL  AMB CONTRAST",ori:"Enfermedad desmielinizante SNC",zona:"columna cervical desmielinizante",contrast:"SI",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:37,nom:"RM DE COLUMNA CERVICAL SENSE CONTRAST",ori:"Cervicalgia con parestesia a nivel C7-C8",zona:"columna cervical",contrast:"NO",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:38,nom:"RM CÈRVIC-DORSAL SENSE CONTRAST",ori:"Síndrome compresión medular+ fractura por aplastamiento en vértebra T6 + tumoración T3-T4",zona:"columna cervico-dorsal",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:39,nom:"RM CÈRVIC-DORSAL SENSE CONTRAST",ori:"Cervicalgia y dorsalgia invalidante",zona:"columna cervico-dorsal",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:40,nom:"RM DE COLUMNA DORSAL SENSE CONTRAST",ori:"Tumoración región dorsal",zona:"columna dorsal",contrast:"DEPENDE",bomba:"NO",equip:"RM1/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:41,nom:"RM DE COLUMNA DORSAL SENSE CONTRAST",ori:"Dolor dorsal",zona:"columna dorsal",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:42,nom:"RM DE COLUMNA DORSAL SENSE/AMB CONTRAST",ori:"Inestabilidad de la marcha",zona:"columna dorsal",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:43,nom:"RM DE COLUMNA DORSAL SENSE/AMB CONTRAST",ori:"Enfermedad desmielinizante SNC",zona:"columna dorsal desmielinizante",contrast:"SI",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:44,nom:"RM DE COLUMNA LUMBAR SENSE CONTRASTE",ori:"Dolor lumbar resistente a tto médico/ lumbalgia",zona:"columna lumbar",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:45,nom:"RM DE COLUMNA LUMBAR SENSE CONTRASTE",ori:"Sospecha fracturas vertebrales",zona:"columna lumbar fractura",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:46,nom:"RM DE COLUMNA LUMBAR SENSE CONTRASTE",ori:"Lumbociatalgia",zona:"columna lumbar ciatica",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:47,nom:"RM DE COLUMNA LUMBAR SENSE CONTRASTE",ori:"Lesión radicular",zona:"columna lumbar radicular",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:48,nom:"RM DE COLUMNA LUMBAR SENSE CONTRASTE",ori:"Enfermedad desmielinizante SNC",zona:"columna lumbar desmielinizante",contrast:"SI",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:49,nom:"RM DE COLUMNA LUMBAR SENSE CONTRASTE",ori:"Estenosis de canal",zona:"columna lumbar estenosis",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:50,nom:"RM DE MEDULAR",ori:"Enfermedad desmielinizante SNC",zona:"columna medular desmielinizante",contrast:"DEPENDE",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"2",nota:null},
  {n:51,nom:"RM COLUMNA COMPLETA",ori:"Compressió medul.lar",zona:"columna completa compresion medular",contrast:"DEPENDE",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"2",nota:null},
  {n:52,nom:"RM ABDOMEN I PELVIS",ori:"Hígado",zona:"abdomen higado",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM1/RM4",huecos:"1",nota:null},
  {n:53,nom:"RM ABDOMEN I PELVIS",ori:"Hígado Quantificació Ferro",zona:"abdomen higado hierro",contrast:"NO",bomba:"NO",equip:"RM5/RM4",huecos:"1",nota:null},
  {n:54,nom:"RM ABDOMEN I PELVIS",ori:"Hígado Multihance",zona:"abdomen higado multihance",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM1/RM4",huecos:"2",nota:null},
  {n:55,nom:"RM ABDOMEN I PELVIS",ori:"Hígado Primovist",zona:"abdomen higado primovist",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM1/RM4",huecos:"2",nota:null},
  {n:56,nom:"RM ABDOMEN I PELVIS",ori:"Nicofib",zona:"abdomen higado nicofib",contrast:"NO",bomba:"NO",equip:"RM2/RM3",huecos:"1",nota:null},
  {n:57,nom:"RM ABDOMEN I PELVIS",ori:"Colagio más hígado",zona:"abdomen higado colangio",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM1/RM4",huecos:"1",nota:null},
  {n:58,nom:"RM ABDOMEN I PELVIS",ori:"RM pancreas con contraste",zona:"abdomen pancreas",contrast:"NO",bomba:"NO",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:59,nom:"RM ABDOMEN I PELVIS",ori:"Entero RM",zona:"abdomen intestino crohn",contrast:"SI",bomba:"SI",equip:"RM2/RM3/RM1",huecos:"1",nota:null},
  {n:60,nom:"RM ABDOMEN I PELVIS",ori:"RM  renal",zona:"abdomen renal rinon",contrast:"SI",bomba:"SI",equip:"RM1/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:61,nom:"RM ABDOMEN I PELVIS",ori:"Suprarenales",zona:"abdomen suprarrenales",contrast:"DEPENDE",bomba:"SI",equip:"RM2/RM3/RM1/RM4",huecos:"1",nota:null},
  {n:62,nom:"RM ABDOMEN I PELVIS",ori:"Colagio",zona:"abdomen vias biliares colangio",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:63,nom:"RM ABDOMEN I PELVIS",ori:"Mioma/Mioma Atípico",zona:"pelvis utero mioma",contrast:"SI",bomba:"SI",equip:"RM1/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:64,nom:"RM ABDOMEN I PELVIS",ori:"Pelvis femenina",zona:"pelvis femenina",contrast:"SI",bomba:"SI",equip:"RM1/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:65,nom:"RM ABDOMEN I PELVIS",ori:"Neo Endometrio",zona:"pelvis endometrio",contrast:"SI",bomba:"SI",equip:"RM1/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:66,nom:"RM ABDOMEN I PELVIS",ori:"Próstata",zona:"pelvis prostata",contrast:"SI",bomba:"SI",equip:"RM3/RM2/RM4/RM1",huecos:"1",nota:null},
  {n:67,nom:"RM ABDOMEN I PELVIS",ori:"Fístula",zona:"pelvis fistula perianal",contrast:"SI",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:68,nom:"RM ABDOMEN I PELVIS",ori:"Endometriosis",zona:"pelvis endometriosis",contrast:"NO",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:69,nom:"RM ABDOMEN I PELVIS",ori:"Cérvix",zona:"pelvis cervix",contrast:"NO",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:70,nom:"RM ABDOMEN I PELVIS",ori:"Recto",zona:"pelvis recto",contrast:"NO",bomba:"NO",equip:"RM2/RM3/RM5/RM4/RM1",huecos:"1",nota:null},
  {n:71,nom:"RM ABDOMEN I PELVIS",ori:"Defeco",zona:"pelvis suelo pelvico",contrast:"NO",bomba:"NO",equip:"RM5/RM4/RM1/RM2/RM3",huecos:"1",nota:null},
  {n:72,nom:"RM PELVIS I EXTREMITAT",ori:"Protocolo tumor",zona:"msk tumor extremidad",contrast:"SI",bomba:"NO",equip:"RM1/RM5/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:73,nom:"RM PELVIS I EXTREMITAT",ori:"RM espatlla-maluc/canell/colze/ma/dits",zona:"msk hombro cadera muneca codo mano",contrast:"NO",bomba:"NO",equip:"RM5/RM1/RM2/RM3/RM4",huecos:"1",nota:null},
  {n:74,nom:"RM PELVIS I EXTREMITAT",ori:"RM artro-espalla- artro Maluc",zona:"msk artro hombro cadera",contrast:"NO",bomba:"NO",equip:"RM1",huecos:"1",nota:null},
  {n:75,nom:"RM PELVIS I EXTREMITAT",ori:"RM /genoll/maluc/turmell/peu",zona:"msk rodilla tobillo pie cadera",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:76,nom:"RM PELVIS I EXTREMITAT",ori:"RM pelvis músculo-esquelética",zona:"msk pelvis musculoesqueletica",contrast:"NO",bomba:"NO",equip:"RM1/RM5/RM4/RM2/RM3",huecos:"1",nota:null},
  {n:77,nom:"RM COS SENSER",ori:"RM cos senser",zona:"cuerpo entero whole body linfoma",contrast:"NO",bomba:"NO",equip:"RM5/RM1/RM3",huecos:"1",nota:null},
  {n:78,nom:"RM COS SENSER",ori:"RM mama amb contrast",zona:"mama cancer",contrast:"SI",bomba:"SI",equip:"RM4/RM3/RM2/RM1",huecos:"1",nota:"NO programar RM1 y RM2 a la vez. Solo disponemos de UNA antena de mama."},
  {n:79,nom:"RM COS SENSER",ori:"RM pròtesi",zona:"mama protesis implante",contrast:"NO",bomba:"NO",equip:"RM4/RM3/RM2/RM1",huecos:"1",nota:"NO programar RM1 y RM2 a la vez. Solo disponemos de UNA antena de mama."},
];

export function buildPromptTable(): string {
  return EXCEL.map((p, i) => {
    const b = p.bomba || "NO";
    const n = p.nota ? ` | NOTA: ${p.nota}` : "";
    return `${i + 1}. PRESTACION:"${p.nom}" | ORIENTACION_DIAGNOSTICA:"${p.ori}" | ZONA_CORPORAL:"${p.zona}" | CONTRAST:${p.contrast} | BOMBA:${b} | EQUIPS:${p.equip} | HUECOS:${p.huecos}${n}`;
  }).join("\n");
}
