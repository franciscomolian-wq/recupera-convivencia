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
      { title: "Medida cautelar de separación temporal (máx. 15 días hábiles)", days: 15, role: "Director/a", basis: "Ley 21.809 — tope legal de 15 días hábiles para medidas de resguardo" },
      { title: "Comunicación a la Superintendencia de Educación", days: 2, role: "Director/a / Sostenedor", basis: "Circular Superintendencia N.º 782 — deber de información" },
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
  docente: { label: "Docente / Profesor Jefe / UTP / Inspector", scope: "limited" },
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
   USUARIOS (autenticación simulada)
   ---------------------------------------------------------------- */
export const USERS = [
  { id: "u0", name: "Administración Central", role: "superadmin", establishmentId: null },
  { id: "u1", name: "Camila Coordinadora", role: "coordinador", establishmentId: "e1" },
  { id: "u2", name: "Director Liceo Ejemplo", role: "director", establishmentId: "e1" },
  { id: "u3", name: "Sostenedor Corp. Quilpué", role: "sostenedor", establishmentId: "e1" },
  { id: "u4", name: "Fiscalizador Superintendencia", role: "superintendencia", establishmentId: "e1" },
  { id: "u5", name: "Profesor Jefe 7°B", role: "docente", establishmentId: "e1" },
  { id: "u6", name: "Apoderado/a J.M.", role: "apoderado", establishmentId: "e1" },
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
  { id: "rice", name: "Reglamento Interno de Convivencia (RICE)", status: "Cargado", updated: "mar 2026" },
  { id: "pei", name: "Proyecto Educativo Institucional (PEI)", status: "Cargado", updated: "dic 2025" },
  { id: "eval", name: "Reglamento de Evaluación (Decreto 67)", status: "Pendiente", updated: "—" },
];
