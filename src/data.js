/* =================================================================
   RECUPERA CONVIVENCIA — CAPA DE DATOS
   Normativa, tipos de caso, instituciones de derivación,
   establecimientos y usuarios (datos de ejemplo, en memoria).
   ================================================================= */

/* ---------------------------------------------------------------
   BIBLIOTECA NORMATIVA (nacional + JUNJI)
   ---------------------------------------------------------------- */
export const NORMATIVA_LIBRARY = [
  { name: "Ley 21.809", desc: "Convivencia, buen trato y bienestar de las comunidades educativas. Núcleo normativo vigente desde julio de 2026: plazos, canales de denuncia, coordinador de convivencia y plan de gestión." },
  { name: "Ley 20.370 (DFL N°2)", desc: "Ley General de Educación. Marco general de finalidades educativas y deberes de la comunidad escolar." },
  { name: "Ley 20.845", desc: "Ley de Inclusión Escolar. No discriminación arbitraria y debido proceso en medidas disciplinarias." },
  { name: "Ley 21.128", desc: "Ley Aula Segura. Procedimiento expedito para hechos graves (armas, agresiones severas)." },
  { name: "Ley 21.643 (Ley Karin)", desc: "Prevención, investigación y sanción del acoso laboral, sexual o de violencia en el trabajo, incluida la ejercida por terceros." },
  { name: "Decreto Circular N°1", desc: "Instrucciones generales de la Superintendencia sobre reglamentos internos y su ajuste a la normativa vigente." },
  { name: "Decreto 67 (2018)", desc: "Normativa mínima nacional de evaluación — se coordina con el Reglamento de Evaluación de cada establecimiento." },
  { name: "Circulares Superintendencia 781, 782 y 202", desc: "Entraron en vigencia junto con la Ley 21.809; precisan obligaciones de información y fiscalización." },
  { name: "Circular N.º 707", desc: "Aplicación del principio de no discriminación arbitraria e igualdad de trato." },
  { name: "Circular N.º 812", desc: "Garantía del derecho a la identidad de género de niñas, niños y adolescentes." },
  { name: "Normativa JUNJI / Marco parvulario", desc: "Estándares de buen trato y protección para jardines infantiles y salas cuna (nivel párvulo)." },
];

/* ---------------------------------------------------------------
   NIVELES EDUCATIVOS (para orientar el caso según el estudiante)
   ---------------------------------------------------------------- */
export const LEVELS = {
  parvulo: "Jardín / Sala cuna (JUNJI)",
  basica: "Enseñanza básica",
  media: "Enseñanza media",
  adultos: "Educación de adultos",
  todos: "Todos los niveles",
};

/* ---------------------------------------------------------------
   INSTITUCIONES DE DERIVACIÓN
   El correo queda vacío: el usuario lo completa al derivar.
   ---------------------------------------------------------------- */
export const INSTITUTIONS = [
  { id: "opd", label: "OPD / Mejor Niñez", type: "protección", email: "" },
  { id: "tribunal", label: "Tribunal de Familia", type: "judicial", email: "" },
  { id: "carabineros", label: "Carabineros de Chile", type: "seguridad", email: "" },
  { id: "pdi", label: "PDI", type: "seguridad", email: "" },
  { id: "fiscalia", label: "Fiscalía (Ministerio Público)", type: "judicial", email: "" },
  { id: "super", label: "Superintendencia de Educación", type: "fiscalización", email: "" },
  { id: "junji", label: "JUNJI", type: "fiscalización", email: "" },
  { id: "senadis", label: "SENADIS", type: "protección", email: "" },
  { id: "dt", label: "Dirección del Trabajo", type: "laboral", email: "" },
  { id: "salud", label: "Salud / Salud mental", type: "salud", email: "" },
  { id: "mutual", label: "Mutual de seguridad", type: "laboral", email: "" },
  { id: "psicosocial", label: "Equipo psicosocial interno", type: "interno", email: "" },
  { id: "senda", label: "SENDA (prevención de drogas)", type: "salud", email: "" },
  { id: "seguroEscolar", label: "Seguro Escolar (Ley 16.744)", type: "salud", email: "" },
  { id: "cesfam", label: "CESFAM / Hospital", type: "salud", email: "" },
  { id: "oln", label: "Oficina Local de la Niñez (OLN)", type: "protección", email: "" },
  { id: "defensoria", label: "Defensoría de la Niñez", type: "protección", email: "" },
  { id: "mejorNinez", label: "Servicio Mejor Niñez", type: "protección", email: "" },
  { id: "pjud", label: "Poder Judicial", type: "judicial", email: "" },
  { id: "slep", label: "Servicio Local de Educación Pública (SLEP)", type: "fiscalización", email: "" },
  { id: "municipio", label: "Municipalidad", type: "comunitaria", email: "" },
  { id: "comunitaria", label: "Organización comunitaria", type: "comunitaria", email: "" },
];

/* Gestión de redes externas (Módulo 8) — tipos, estados y semillas */
export const GESTION_TYPES = ["Oficio enviado", "Derivación", "Informe", "Respuesta recibida", "Audiencia", "Medida judicial", "Cumplimiento de resolución"];
export const GESTION_ESTADOS = ["Pendiente", "En curso", "Respondido", "Cumplido"];

export const INITIAL_GESTIONES = [
  { id: "g1", tipo: "Derivación", institucion: "OPD / Mejor Niñez", caso: "RC-2026-009", fecha: "2026-07-15", detalle: "Derivación por vulneración de derechos.", estado: "En curso" },
  { id: "g2", tipo: "Oficio enviado", institucion: "Tribunal de Familia", caso: "RC-2026-009", fecha: "2026-07-20", detalle: "Oficio informando medidas adoptadas.", estado: "Pendiente" },
  { id: "g3", tipo: "Medida judicial", institucion: "Tribunal de Familia", caso: "RC-2026-021", fecha: "2026-07-25", detalle: "Medida cautelar de protección dictada.", estado: "En curso" },
];

/* Gestión documental (Módulo 9) — categorías y repositorio */
export const DOC_CATEGORIES = ["Informe", "Acta", "Protocolo", "Formulario", "Oficio", "Resolución", "Certificado", "Consentimiento", "Evidencia", "Otro"];

export const INITIAL_DOCUMENTS = [
  { id: "d1", nombre: "Acta de entrevista inicial — RC-2026-014", categoria: "Acta", caso: "RC-2026-014", fecha: "2026-07-01", url: "" },
  { id: "d2", nombre: "Protocolo de acoso escolar (RICE)", categoria: "Protocolo", caso: "", fecha: "2026-03-15", url: "" },
  { id: "d3", nombre: "Consentimiento informado apoderado J.M.", categoria: "Consentimiento", caso: "RC-2026-014", fecha: "2026-07-02", url: "" },
];

/* ---------------------------------------------------------------
   TIPOS DE CASO (situaciones predefinidas)
   Cada uno declara: relación involucrada, niveles aplicables,
   palabras clave (para el analizador de texto libre), redes
   sugeridas (ids de INSTITUTIONS) y el paso a paso normado.
   ---------------------------------------------------------------- */
export const CASE_TYPES = {
  bullying: {
    label: "Maltrato entre estudiantes / acoso escolar",
    relacion: "Estudiante ↔ Estudiante",
    levels: ["basica", "media"],
    keywords: ["acoso", "bullying", "molestan", "apodo", "burla", "hostigan", "ciberacoso", "redes sociales", "amenazan", "excluyen"],
    network: ["opd", "psicosocial", "super"],
    steps: [
      { title: "Acogida y registro confidencial de la denuncia", days: 2, role: "Coordinador de Convivencia", basis: "Ley 21.809 — canal de denuncia seguro y confidencial" },
      { title: "Evaluación de riesgo y medidas de resguardo inmediatas", days: 3, role: "Coordinador de Convivencia", basis: "Ley 21.809 — medidas de protección mientras dura la investigación" },
      { title: "Activación del protocolo de investigación (imparcial, proporcional y célere)", days: 5, role: "Coordinador de Convivencia", basis: "Ley 21.809 — estándares del procedimiento investigativo" },
      { title: "Entrevistas a involucrados y recopilación de antecedentes", days: 20, role: "Equipo de Convivencia", basis: "Ley 21.809 — debido proceso, pertinencia según estamento" },
      { title: "Informe de investigación y propuesta de medidas", days: 45, role: "Coordinador de Convivencia", basis: "Ley 21.809 — plazo máximo de 2 meses para faltas graves/gravísimas" },
      { title: "Resolución, notificación a las familias y derecho a apelación", days: 55, role: "Director/a", basis: "Ley 20.845 — debido proceso y derecho a apelar" },
      { title: "Seguimiento y cierre del caso", days: 90, role: "Coordinador de Convivencia", basis: "Ley 21.809 — monitoreo semestral de medidas" },
    ],
  },
  agresionGrave: {
    label: "Agresión física grave / arma en el establecimiento",
    relacion: "Cualquier integrante",
    levels: ["basica", "media", "adultos"],
    keywords: ["arma", "cuchillo", "golpiza", "sangre", "herido", "pelea grave", "fractura", "hospital", "puñal"],
    network: ["carabineros", "pdi", "fiscalia", "super", "salud"],
    steps: [
      { title: "Resguardo inmediato de la integridad de las personas", days: 0, role: "Director/a / Inspector General", basis: "Ley 21.128 (Aula Segura) — actuación inmediata ante hechos graves" },
      { title: "Denuncia obligatoria a Carabineros/PDI y, si corresponde, a Fiscalía", days: 1, role: "Director/a", basis: "Código Procesal Penal, art. 175 y 176 — denuncia obligatoria de funcionarios públicos" },
      { title: "Aplicación de medida cautelar de separación temporal (duración máx. 15 días hábiles)", days: 2, role: "Director/a", basis: "Ley 21.809 — tope legal de 15 días hábiles para medidas de resguardo" },
      { title: "Comunicación a la Superintendencia de Educación", days: 3, role: "Director/a / Sostenedor", basis: "Circular Superintendencia N.º 782 — deber de información" },
      { title: "Comisión previa a expulsión (profesor jefe + coordinador + representante técnico-pedagógico)", days: 10, role: "Comisión ad-hoc", basis: "Ley 21.809 — informe de comisión obligatorio antes de expulsar o cancelar matrícula" },
      { title: "Resolución final y notificación con derecho a apelación", days: 15, role: "Director/a", basis: "Ley 21.128 — procedimiento expedito, Ley 20.845 — debido proceso" },
    ],
  },
  discriminacion: {
    label: "Discriminación arbitraria",
    relacion: "Cualquier integrante",
    levels: ["parvulo", "basica", "media", "adultos"],
    keywords: ["discrimina", "racismo", "nacionalidad", "migrante", "género", "identidad", "religión", "discapacidad", "orientación", "xenofobia"],
    network: ["super", "psicosocial", "senadis"],
    steps: [
      { title: "Registro de la denuncia con reserva de identidad", days: 2, role: "Coordinador de Convivencia", basis: "Circular Superintendencia N.º 707 — no discriminación arbitraria" },
      { title: "Aplicación del protocolo de no discriminación / identidad de género si corresponde", days: 5, role: "Coordinador de Convivencia", basis: "Circular Superintendencia N.º 812 — identidad de género" },
      { title: "Investigación imparcial y proporcional", days: 30, role: "Coordinador de Convivencia", basis: "Ley 21.809 — estándares investigativos" },
      { title: "Informe y medidas formativas o disciplinarias", days: 45, role: "Coordinador de Convivencia", basis: "Ley 21.809 — plazo máximo 2 meses" },
      { title: "Notificación a la familia y seguimiento", days: 60, role: "Director/a", basis: "Ley 20.845 — debido proceso" },
    ],
  },
  violenciaFuncionario: {
    label: "Violencia de apoderado o tercero hacia un/a funcionario/a",
    relacion: "Apoderado / tercero → Trabajador",
    levels: ["parvulo", "basica", "media", "adultos"],
    keywords: ["apoderado agredió", "insultó", "amenaza", "funcionario", "profesor", "karin", "hostigamiento laboral", "gritó", "agredió al docente"],
    network: ["dt", "super", "mutual"],
    steps: [
      { title: "Registro y resguardo del/de la trabajador/a afectado/a", days: 2, role: "Coordinador de Convivencia / Prevención", basis: "Ley 21.643 (Ley Karin) — protección frente a violencia de terceros" },
      { title: "Coordinación del procedimiento educativo y laboral bajo un solo expediente", days: 5, role: "Coordinador de Convivencia", basis: "Ley 21.809 — coordinación cuando concurre la Ley 21.643" },
      { title: "Investigación conjunta (convivencia + protocolo laboral)", days: 30, role: "Coordinador / Prevención", basis: "Ley 21.643 y Ley 21.809" },
      { title: "Medidas de resguardo hacia el/la funcionario/a y resolución", days: 45, role: "Director/a / Sostenedor", basis: "Ley 21.643 — deber de protección del empleador" },
    ],
  },
  maltratoDocenteEstudiante: {
    label: "Maltrato de un/a funcionario/a hacia un/a estudiante",
    relacion: "Trabajador → Estudiante",
    levels: ["parvulo", "basica", "media", "adultos"],
    keywords: ["profesor humilla", "docente grita", "trato vejatorio", "funcionario maltrata", "ridiculiza", "castigo", "descalifica", "grita al alumno"],
    network: ["super", "psicosocial", "opd"],
    steps: [
      { title: "Registro confidencial y resguardo del/de la estudiante", days: 2, role: "Coordinador de Convivencia", basis: "Ley 21.809 — deber de protección del estudiante" },
      { title: "Medidas de resguardo (separación de funciones si procede)", days: 3, role: "Director/a", basis: "Ley 21.809 — medidas mientras dura la investigación" },
      { title: "Investigación imparcial con debido proceso para el/la funcionario/a", days: 20, role: "Coordinador / Sostenedor", basis: "Ley 21.809 — debido proceso también para el trabajador" },
      { title: "Informe, medidas y comunicación a la familia", days: 40, role: "Director/a", basis: "Ley 20.845 — debido proceso y notificación" },
      { title: "Seguimiento y monitoreo", days: 60, role: "Coordinador de Convivencia", basis: "Ley 21.809 — monitoreo de medidas" },
    ],
  },
  vulneracion: {
    label: "Sospecha de vulneración de derechos (extra-escolar)",
    relacion: "Estudiante (contexto familiar/externo)",
    levels: ["parvulo", "basica", "media"],
    keywords: ["abuso", "tocaciones", "negligencia", "maltrato familiar", "autolesión", "hambre", "descuido", "violencia en el hogar", "sospecha"],
    network: ["opd", "tribunal", "salud"],
    steps: [
      { title: "Registro confidencial y contención inicial del/de la estudiante", days: 1, role: "Coordinador de Convivencia", basis: "Ley 21.809 — deber de protección; no corresponde investigar hechos del hogar" },
      { title: "Derivación obligatoria a la red de protección (OPD / Mejor Niñez)", days: 2, role: "Coordinador de Convivencia", basis: "Ley de Garantías y Protección Integral de la Niñez — deber de derivación" },
      { title: "Acompañamiento psicosocial en el establecimiento", days: 15, role: "Equipo psicosocial", basis: "Ley 21.809 — bienestar y salud mental" },
      { title: "Seguimiento coordinado con la red externa", days: 45, role: "Coordinador de Convivencia", basis: "Ley 21.809 — monitoreo continuo" },
    ],
  },
  junjiParvulo: {
    label: "Situación de buen trato en nivel párvulo (JUNJI)",
    relacion: "Párvulo / comunidad del jardín",
    levels: ["parvulo"],
    keywords: ["párvulo", "jardín", "sala cuna", "junji", "mordida", "educadora", "lactante", "cuidado", "pañal"],
    network: ["junji", "opd", "salud"],
    steps: [
      { title: "Registro y contención inmediata del párvulo", days: 1, role: "Directora del jardín", basis: "Normativa JUNJI — buen trato y protección del párvulo" },
      { title: "Comunicación a la familia y a JUNJI si corresponde", days: 2, role: "Directora del jardín", basis: "Normativa JUNJI — deber de información" },
      { title: "Revisión de prácticas de cuidado y medidas correctivas", days: 10, role: "Equipo del jardín", basis: "Marco parvulario — mejora de prácticas de buen trato" },
      { title: "Seguimiento y cierre", days: 30, role: "Directora del jardín", basis: "Normativa JUNJI — monitoreo" },
    ],
  },
  ciberacoso: {
    label: "Ciberacoso / acoso por medios digitales",
    relacion: "Estudiante ↔ Estudiante (medios digitales)",
    levels: ["basica", "media"],
    keywords: ["ciberacoso", "ciberbullying", "redes sociales", "whatsapp", "instagram", "tiktok", "captura", "viralizaron", "difusión de imágenes", "grooming", "meme"],
    network: ["psicosocial", "super", "pdi"],
    steps: [
      { title: "Acogida, registro y resguardo de la evidencia digital (capturas, enlaces)", days: 2, role: "Coordinador de Convivencia", basis: "Ley 21.809 — canal de denuncia; resguardo probatorio" },
      { title: "Evaluación de riesgo y medidas de protección (incluye ciberespacio)", days: 3, role: "Coordinador de Convivencia", basis: "Ley 21.809 — medidas de protección" },
      { title: "Investigación imparcial; si hay delito, denuncia a PDI Cibercrimen", days: 15, role: "Coordinador de Convivencia", basis: "Ley 21.809; Código Procesal Penal art. 175-176" },
      { title: "Informe, medidas formativas/disciplinarias y notificación a familias", days: 40, role: "Director/a", basis: "Ley 21.809 — plazo máximo 2 meses; Ley 20.845 debido proceso" },
      { title: "Seguimiento y cierre", days: 80, role: "Coordinador de Convivencia", basis: "Ley 21.809 — monitoreo" },
    ],
  },
  drogas: {
    label: "Consumo o tráfico de drogas / alcohol",
    relacion: "Estudiante(s)",
    levels: ["basica", "media", "adultos"],
    keywords: ["droga", "marihuana", "alcohol", "consumo", "tráfico", "microtráfico", "pastillas", "sustancias", "porros"],
    network: ["senda", "carabineros", "salud", "opd"],
    steps: [
      { title: "Acogida y resguardo del/de la estudiante; registro confidencial", days: 1, role: "Coordinador de Convivencia", basis: "Ley 21.809 — protección; enfoque de cuidado no punitivo en consumo" },
      { title: "Si hay tráfico/microtráfico: denuncia obligatoria a Carabineros/PDI/Fiscalía", days: 1, role: "Director/a", basis: "Ley 20.000; Código Procesal Penal art. 175-176" },
      { title: "Derivación a SENDA / salud para evaluación y tratamiento", days: 3, role: "Equipo psicosocial", basis: "Política de prevención SENDA-MINEDUC" },
      { title: "Entrevista con apoderados y plan de acompañamiento", days: 10, role: "Coordinador de Convivencia", basis: "Ley 21.809 — corresponsabilidad familiar" },
      { title: "Seguimiento del plan y coordinación con la red", days: 60, role: "Equipo psicosocial", basis: "Ley 21.809 — monitoreo" },
    ],
  },
  accidenteEscolar: {
    label: "Accidente escolar",
    relacion: "Estudiante",
    levels: ["parvulo", "basica", "media", "adultos"],
    keywords: ["accidente", "caída", "golpe", "fractura", "herida", "enfermería", "lesión", "recreo", "trayecto"],
    network: ["salud", "seguroEscolar", "cesfam"],
    steps: [
      { title: "Atención inmediata / primeros auxilios y resguardo del/de la estudiante", days: 0, role: "Inspectoría / Encargado de primeros auxilios", basis: "Ley 16.744 — Seguro Escolar; deber de cuidado" },
      { title: "Activación del Seguro Escolar y traslado a la red de salud si corresponde", days: 0, role: "Director/a / Inspectoría", basis: "Ley 16.744 — Seguro Escolar de Accidentes" },
      { title: "Aviso inmediato al apoderado", days: 0, role: "Inspectoría General", basis: "Deber de información a la familia" },
      { title: "Registro y Declaración Individual de Accidente Escolar (DIAE)", days: 1, role: "Encargado de Prevención", basis: "Ley 16.744 — declaración del accidente" },
      { title: "Seguimiento del estado de salud y reintegro", days: 10, role: "Inspectoría General", basis: "Deber de acompañamiento" },
    ],
  },
  situacionRiesgo: {
    label: "Situación de riesgo / salud mental (autolesión, ideación suicida)",
    relacion: "Estudiante",
    levels: ["basica", "media", "adultos"],
    keywords: ["autolesión", "ideación", "suicida", "cortes", "riesgo", "crisis", "ansiedad", "depresión", "autoflagelación", "salud mental"],
    network: ["salud", "psicosocial", "cesfam", "opd"],
    steps: [
      { title: "Contención inmediata y resguardo; no dejar solo/a al/la estudiante", days: 0, role: "Dupla psicosocial / Orientación", basis: "Protocolo de retención y prevención — MINEDUC" },
      { title: "Comunicación al apoderado y activación de la red de apoyo", days: 1, role: "Coordinador de Convivencia", basis: "Corresponsabilidad y deber de protección" },
      { title: "Derivación a salud / salud mental (CESFAM u hospital)", days: 2, role: "Equipo psicosocial", basis: "Ley 21.809 — bienestar y salud mental" },
      { title: "Plan de acompañamiento y medidas de resguardo escolar", days: 5, role: "Orientación / Convivencia", basis: "Protocolo MINEDUC de prevención" },
      { title: "Seguimiento coordinado con la red de salud", days: 45, role: "Equipo psicosocial", basis: "Ley 21.809 — monitoreo continuo" },
    ],
  },
  disciplinario: {
    label: "Incidente disciplinario (falta al reglamento)",
    relacion: "Estudiante(s)",
    levels: ["basica", "media", "adultos"],
    keywords: ["falta", "reglamento", "indisciplina", "desafío", "conducta", "interrupción", "irrespeto", "anotación"],
    network: ["psicosocial"],
    steps: [
      { title: "Registro de la falta en la hoja de vida", days: 1, role: "Inspectoría General / Docente", basis: "Reglamento Interno de Convivencia (RICE)" },
      { title: "Tipificación de la falta (leve/grave/gravísima) según el reglamento", days: 2, role: "Inspectoría General", basis: "RICE — gradualidad y proporcionalidad" },
      { title: "Entrevista y descargos del/de la estudiante (debido proceso)", days: 5, role: "Inspectoría General", basis: "Ley 20.845 — debido proceso y derecho a defensa" },
      { title: "Aplicación de medida formativa/disciplinaria proporcional", days: 8, role: "Director/a / Inspectoría", basis: "RICE; Ley 20.845 — proporcionalidad" },
      { title: "Notificación al apoderado y registro del acuerdo", days: 10, role: "Profesor/a Jefe", basis: "Deber de información y corresponsabilidad" },
      { title: "Seguimiento formativo", days: 30, role: "Profesor/a Jefe / Convivencia", basis: "RICE — enfoque formativo" },
    ],
  },
  denunciaInterna: {
    label: "Denuncia interna (canal de convivencia)",
    relacion: "Cualquier integrante de la comunidad",
    levels: ["parvulo", "basica", "media", "adultos"],
    keywords: ["denuncia", "reclamo", "canal", "confidencial", "anónima", "buzón"],
    network: ["psicosocial", "super"],
    steps: [
      { title: "Recepción confidencial de la denuncia (con reserva de identidad)", days: 1, role: "Coordinador de Convivencia", basis: "Ley 21.809 — canal de denuncia seguro y confidencial" },
      { title: "Evaluación de admisibilidad y derivación al protocolo pertinente", days: 2, role: "Coordinador de Convivencia", basis: "Ley 21.809 — pertinencia del procedimiento" },
      { title: "Medidas de resguardo hacia el/la denunciante", days: 3, role: "Coordinador de Convivencia", basis: "Ley 21.809 — protección frente a represalias" },
      { title: "Tramitación según el tipo de situación y respuesta al denunciante", days: 10, role: "Equipo de Convivencia", basis: "Ley 21.809 — debido proceso" },
    ],
  },
};

/* ---------------------------------------------------------------
   ROLES (portal usuario)
   ---------------------------------------------------------------- */
export const ROLES = {
  superadmin: { label: "Súper Administrador", scope: "superadmin" },
  coordinador: { label: "Coordinador/a de Convivencia", scope: "admin" },
  director: { label: "Director/a", scope: "audit" },
  sostenedor: { label: "Sostenedor", scope: "audit" },
  superintendencia: { label: "Superintendencia de Educación", scope: "audit" },
  inspectoria: { label: "Inspectoría General", scope: "admin" },
  pie: { label: "PIE (Programa de Integración Escolar)", scope: "limited" },
  orientacion: { label: "Orientación", scope: "limited" },
  utp: { label: "UTP", scope: "limited" },
  profesorJefe: { label: "Profesor/a Jefe", scope: "limited" },
  docente: { label: "Docente", scope: "limited" },
  asistente: { label: "Asistente de la Educación", scope: "limited" },
  apoderado: { label: "Apoderado/a", scope: "family" },
};

/* ---------------------------------------------------------------
   ESTABLECIMIENTOS (para el súper administrador)
   ---------------------------------------------------------------- */
export const ESTABLISHMENTS = [
  { id: "e1", name: "Liceo Ejemplo", comuna: "Quilpué", type: "media", sostenedor: "Corp. Municipal Quilpué", activos: 3, vencidos: 1, cumplimiento: 82, students: 820, ufPerStudent: 0.05, paidUF: 41 },
  { id: "e2", name: "Escuela Los Aromos", comuna: "Villa Alemana", type: "basica", sostenedor: "SLEP Valparaíso", activos: 5, vencidos: 0, cumplimiento: 94, students: 460, ufPerStudent: 0.05, paidUF: 0 },
  { id: "e3", name: "Jardín Semillita", comuna: "Viña del Mar", type: "parvulo", sostenedor: "JUNJI", activos: 2, vencidos: 0, cumplimiento: 100, students: 90, ufPerStudent: 0.06, paidUF: 5.4 },
  { id: "e4", name: "CEIA Adultos Puerto", comuna: "Valparaíso", type: "adultos", sostenedor: "SLEP Valparaíso", activos: 4, vencidos: 2, cumplimiento: 68, students: 310, ufPerStudent: 0.05, paidUF: 7.75 },
];

/* ---------------------------------------------------------------
   FACTURACIÓN — valor UF referencial e histórico de ingresos
   La plataforma cobra a cada institución una tarifa en UF por
   estudiante. El valor de la UF es editable en el panel.
   ---------------------------------------------------------------- */
export const UF_VALUE_CLP = 39250;

export const MONTHLY_REVENUE_UF = [
  { month: "Mar", uf: 62 },
  { month: "Abr", uf: 68 },
  { month: "May", uf: 71 },
  { month: "Jun", uf: 77 },
  { month: "Jul", uf: 81 },
  { month: "Ago", uf: 84.9 },
];

/* ---------------------------------------------------------------
   ESTUDIANTES — expediente digital único por estudiante
   Reúne su historial transversal a todos sus casos.
   ---------------------------------------------------------------- */
export const STUDENTS = [
  {
    id: "s1", name: "Estudiante J. M.", curso: "7°B", nivel: "basica", establishmentId: "e1",
    entrevistas: [{ id: "en1", fecha: "2026-06-30", con: "Apoderado/a", resumen: "Se informa la situación y se acuerdan medidas de acompañamiento." }],
    citaciones: [{ id: "ci1", fecha: "2026-07-05", motivo: "Entrevista de convivencia", estado: "Asiste", excusa: "" }],
    compromisos: [{ id: "co1", texto: "Asistir a talleres de habilidades sociales", cumplido: false }],
    medidas: [{ id: "me1", tipo: "formativa", descripcion: "Participación en programa de mediación entre pares", fecha: "2026-07-06" }],
    anotaciones: [
      { id: "an1", tipo: "negativa", fecha: "2026-06-28", descripcion: "Interrumpe reiteradamente la clase." },
      { id: "an2", tipo: "positiva", fecha: "2026-07-10", descripcion: "Colabora en la mediación con un compañero." },
    ],
    suspensiones: [],
    atrasos: [{ id: "at1", fecha: "2026-07-02", cantidad: 1 }],
    retiros: [],
    nee: true, neeTipo: "NEE transitoria (dificultades específicas de aprendizaje)",
    pieInformes: [{ id: "pi1", fecha: "2026-06-20", profesional: "Psicopedagoga", resumen: "Evaluación diagnóstica; se sugiere adecuación de tiempos." }],
    pieAdecuaciones: [{ id: "pa1", fecha: "2026-06-25", descripcion: "Tiempo adicional en evaluaciones." }],
    pieEstrategias: [{ id: "pe1", descripcion: "Refuerzo lector individual", paec: true }],
    pieReuniones: [{ id: "pr1", fecha: "2026-07-01", participantes: "PIE, Prof. Jefe, Convivencia", acuerdos: "Monitoreo mensual de avances." }],
    apoderadoNombre: "María (apoderada de J.M.)", apoderadoEmail: "apoderado.jm@correo.cl",
    citacionesApo: [{ id: "ca1", fecha: "2026-08-06", hora: "10:30", motivo: "Informar avance del caso", estado: "Pendiente", nuevaFecha: "", firma: null }],
    acuerdosApo: [{ id: "aa1", fecha: "2026-06-30", acuerdo: "Reforzar acompañamiento en el hogar", cumplido: false, firma: null }],
    docsApo: [{ id: "da1", fecha: "2026-07-01", nombre: "Acta de entrevista inicial.pdf" }],
  },
  { id: "s2", name: "Estudiante F. T.", curso: "2°M", nivel: "media", establishmentId: "e1", entrevistas: [], citaciones: [], compromisos: [], medidas: [], anotaciones: [], suspensiones: [], atrasos: [], retiros: [], nee: false, neeTipo: "", pieInformes: [], pieAdecuaciones: [], pieEstrategias: [], pieReuniones: [], apoderadoNombre: "Apoderado/a de F.T.", apoderadoEmail: "apoderado.ft@correo.cl", citacionesApo: [], acuerdosApo: [], docsApo: [] },
  { id: "s3", name: "Estudiante C. R.", curso: "4°B", nivel: "basica", establishmentId: "e1", entrevistas: [], citaciones: [], compromisos: [], medidas: [], anotaciones: [], suspensiones: [], atrasos: [], retiros: [], nee: false, neeTipo: "", pieInformes: [], pieAdecuaciones: [], pieEstrategias: [], pieReuniones: [], apoderadoNombre: "Apoderado/a de C.R.", apoderadoEmail: "apoderado.cr@correo.cl", citacionesApo: [], acuerdosApo: [], docsApo: [] },
];

export const MEASURE_TYPES = [
  { value: "formativa", label: "Medida formativa" },
  { value: "disciplinaria", label: "Medida disciplinaria" },
  { value: "pedagogica", label: "Medida / acuerdo pedagógico" },
];

/* Inspectoría — tipos de anotación en la hoja de vida */
export const ANOTACION_TYPES = [
  { value: "positiva", label: "Positiva" },
  { value: "negativa", label: "Negativa" },
  { value: "neutra", label: "Neutra / informativa" },
];

/* Agenda — tipos de evento */
export const EVENT_TYPES = ["Entrevista", "Reunión", "Citación", "Audiencia", "Visita domiciliaria", "Seguimiento", "Otro"];

/* Comunicación interna — mensajes iniciales (demo) */
export const INITIAL_MESSAGES = [
  { id: "m1", from: "Dirección", fromRole: "Director/a", to: "todos", subject: "Reunión de equipo de convivencia", body: "Se cita a reunión el viernes a las 15:00 para revisar casos activos.", at: "2026-07-29", read: false },
  { id: "m2", from: "Equipo PIE", fromRole: "PIE (Programa de Integración Escolar)", to: "coordinador", subject: "Estudiante con NEE requiere adecuación", body: "Solicitamos coordinar una reunión interdisciplinaria por el caso del 7°B.", at: "2026-07-31", read: false },
];

/* Agenda — eventos iniciales (demo) */
export const INITIAL_EVENTS = [
  { id: "ev1", tipo: "Entrevista", title: "Entrevista con apoderado/a J.M.", fecha: "2026-08-06", hora: "10:30", notas: "Caso RC-2026-014", recordar: 1 },
  { id: "ev2", tipo: "Reunión", title: "Reunión de equipo de convivencia", fecha: "2026-08-08", hora: "15:00", notas: "Revisión de casos activos", recordar: 2 },
  { id: "ev3", tipo: "Visita domiciliaria", title: "Visita domiciliaria estudiante 4°B", fecha: "2026-08-12", hora: "11:00", notas: "Coordinar con dupla psicosocial", recordar: 1 },
];

/* ---------------------------------------------------------------
   USUARIOS (autenticación simulada)
   ---------------------------------------------------------------- */
export const USERS = [
  { id: "u0", name: "Administración Central", role: "superadmin", establishmentId: null },
  { id: "u1", name: "Camila Coordinadora", role: "coordinador", establishmentId: "e1" },
  { id: "u2", name: "Director Liceo Ejemplo", role: "director", establishmentId: "e1" },
  { id: "u3", name: "Sostenedor Corp. Quilpué", role: "sostenedor", establishmentId: "e1" },
  { id: "u4", name: "Fiscalizador Superintendencia", role: "superintendencia", establishmentId: "e1" },
  { id: "u5", name: "Profesor Jefe 7°B", role: "profesorJefe", establishmentId: "e1" },
  { id: "u6", name: "Apoderado/a J.M.", role: "apoderado", establishmentId: "e1" },
  { id: "u7", name: "Inspectoría General", role: "inspectoria", establishmentId: "e1" },
  { id: "u8", name: "Equipo PIE", role: "pie", establishmentId: "e1" },
  { id: "u9", name: "Orientación", role: "orientacion", establishmentId: "e1" },
];

/* ---------------------------------------------------------------
   NOTIFICACIONES iniciales (campana del portal usuario)
   ---------------------------------------------------------------- */
export const INITIAL_NOTIFICATIONS = [
  { id: "n1", from: "Superintendencia de Educación", title: "Nueva circular sobre plazos de investigación", body: "Se recuerda el tope de 2 meses para faltas graves. Revise sus casos activos.", at: "2026-07-30", read: false },
  { id: "n2", from: "Súper Administrador", title: "Actualización del motor normativo", body: "Se incorporó la normativa JUNJI para nivel párvulo.", at: "2026-07-28", read: false },
];

/* ---------------------------------------------------------------
   TIPOS DE EVIDENCIA (para tipificar lo que se adjunta a cada paso)
   ---------------------------------------------------------------- */
export const EVIDENCE_TYPES = ["Acta", "Audio", "Video", "Foto", "Entrevista", "Publicación / captura", "Documento", "Otro"];

/* ---------------------------------------------------------------
   CORREOS PERSONALIZABLES (múltiples plantillas)
   Campos dinámicos: {ID}, {ETAPA}, {ESTUDIANTE}
   ---------------------------------------------------------------- */
export const DEFAULT_EMAIL_TEMPLATES = {
  notificacion: {
    label: "Notificación de avance",
    subject: "Actualización de su caso {ID}",
    body: "Estimado/a apoderado/a,\n\nLe informamos que el caso {ID} ({ESTUDIANTE}) se encuentra en la etapa: {ETAPA}.\nPuede revisar el avance ingresando al portal con su cuenta.\n\nEquipo de Convivencia Educativa",
  },
  citacion: {
    label: "Citación a entrevista",
    subject: "Citación a entrevista — caso {ID}",
    body: "Estimado/a apoderado/a,\n\nEn el marco del caso {ID}, se le cita a una entrevista para recabar antecedentes.\nPor favor coordine día y hora con el Equipo de Convivencia.\n\nEquipo de Convivencia Educativa",
  },
  resolucion: {
    label: "Notificación de resolución",
    subject: "Resolución del caso {ID}",
    body: "Estimado/a apoderado/a,\n\nSe ha resuelto el caso {ID} ({ESTUDIANTE}). Adjuntamos la resolución y las medidas adoptadas.\nRecuerde que tiene derecho a apelación dentro del plazo indicado.\n\nDirección del Establecimiento",
  },
};

/* ---------------------------------------------------------------
   FORMATOS / PLANTILLAS DE ENTREVISTA Y ACTA (imprimibles)
   ---------------------------------------------------------------- */
export const INTERVIEW_TEMPLATES = [
  {
    id: "ent-apoderado", title: "Entrevista a apoderado/a", audience: "Apoderado/a",
    fields: ["Nombre del apoderado/a", "Estudiante / curso", "Fecha y hora", "Motivo de la entrevista", "Relato del apoderado/a", "Acuerdos y compromisos", "Firma apoderado/a", "Firma entrevistador/a"],
  },
  {
    id: "ent-estudiante", title: "Entrevista a estudiante", audience: "Estudiante",
    fields: ["Nombre del estudiante / curso", "Fecha y hora", "Persona de confianza presente", "Relato del/de la estudiante", "Estado emocional observado", "Medidas de resguardo aplicadas", "Firma profesional a cargo"],
  },
  {
    id: "ent-funcionario", title: "Entrevista a funcionario/a", audience: "Funcionario/a",
    fields: ["Nombre del funcionario/a", "Cargo", "Fecha y hora", "Antecedentes que aporta", "Declaración", "Firma funcionario/a", "Firma entrevistador/a"],
  },
  {
    id: "acta", title: "Acta de reunión / declaración", audience: "General",
    fields: ["Caso N.º", "Fecha y lugar", "Asistentes", "Materia tratada", "Desarrollo", "Acuerdos", "Próxima acción y plazo", "Firmas"],
  },
];

/* ---------------------------------------------------------------
   DOCUMENTOS PROPIOS DEL ESTABLECIMIENTO
   (distintos en cada uno; alimentan el motor junto a la normativa)
   ---------------------------------------------------------------- */
export const DEFAULT_ESTABLISHMENT_DOCS = [
  { id: "rice", name: "Reglamento Interno de Convivencia (RICE)", status: "Cargado", updated: "mar 2026", url: "" },
  { id: "pei", name: "Proyecto Educativo Institucional (PEI)", status: "Cargado", updated: "dic 2025", url: "" },
  { id: "eval", name: "Reglamento de Evaluación (Decreto 67)", status: "Pendiente", updated: "—", url: "" },
  { id: "pme", name: "Plan de Mejoramiento Educacional (PME)", status: "Pendiente", updated: "—", url: "" },
];

/* Plan de convivencia y PME (Plan de Mejoramiento Educacional) */
export const PME_DIMENSIONS = ["Gestión Pedagógica", "Liderazgo Escolar", "Convivencia Escolar", "Gestión de Recursos"];

export const INITIAL_ACCIONES = [
  { id: "ac1", nombre: "Talleres de habilidades socioemocionales", dimension: "Convivencia Escolar", objetivo: "Fortalecer la convivencia y prevenir conflictos", responsable: "Coordinador de Convivencia", inicio: "2026-03-10", termino: "2026-11-30", avance: 45 },
  { id: "ac2", nombre: "Actualización participativa del RICE", dimension: "Convivencia Escolar", objetivo: "Revisar el reglamento con la comunidad", responsable: "Equipo de Convivencia", inicio: "2026-04-01", termino: "2026-09-30", avance: 70 },
  { id: "ac3", nombre: "Plan de mediación entre pares", dimension: "Convivencia Escolar", objetivo: "Implementar mediación escolar", responsable: "Dupla psicosocial", inicio: "2026-05-01", termino: "2026-12-15", avance: 30 },
];
