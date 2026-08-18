// Cliente de la API de Recupera Convivencia.
// La URL se puede sobreescribir con VITE_API_URL; por defecto apunta a producción (Railway).
const API_URL =
  import.meta.env.VITE_API_URL || "https://recupera-api-production.up.railway.app";

const TOKEN_KEY = "rc_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = "Bearer " + t;
  }
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw { message: "No se pudo conectar con el servidor. Revisa tu conexión." };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const api = {
  url: API_URL,

  // Login por RUT + contraseña (+ código 2FA cuando corresponde).
  // Lanza { twofa: true } si falta / falla el código de verificación.
  login: (rut, password, token) =>
    request("/api/auth/login", { method: "POST", body: { rut, password, token } }),

  me: () => request("/api/auth/me", { auth: true }),

  setup2fa: () => request("/api/auth/2fa/setup", { method: "POST", auth: true }),
  enable2fa: (token) => request("/api/auth/2fa/enable", { method: "POST", body: { token }, auth: true }),
  disable2fa: (password) => request("/api/auth/2fa/disable", { method: "POST", body: { password }, auth: true }),

  // --- Invitación / activación de cuentas ---
  inviteInfo: (token) => request(`/api/auth/invite/${token}`),
  activate: (token, password) => request("/api/auth/activate", { method: "POST", body: { token, password } }),
  forgotPassword: (rut) => request("/api/auth/forgot", { method: "POST", body: { rut } }),
  resetInfo: (token) => request(`/api/auth/reset/${token}`),
  resetPassword: (token, password) => request("/api/auth/reset", { method: "POST", body: { token, password } }),
  listUsers: () => request("/api/users", { auth: true }),
  inviteUser: (payload) => request("/api/users/invite", { method: "POST", body: payload, auth: true }),
  reinviteUser: (id) => request(`/api/users/${id}/reinvite`, { method: "POST", auth: true }),
  updateUser: (id, patch) => request(`/api/users/${id}`, { method: "PATCH", body: patch, auth: true }),
  bulkInvite: (users) => request("/api/users/bulk-invite", { method: "POST", body: { users }, auth: true }),

  // --- Casos ---
  listCases: () => request("/api/cases", { auth: true }),
  createCase: (payload) => request("/api/cases", { method: "POST", body: payload, auth: true }),
  closeCase: (id, summary) => request(`/api/cases/${id}/close`, { method: "POST", body: { summary }, auth: true }),
  stepDone: (id, order) => request(`/api/cases/${id}/steps/${order}/done`, { method: "POST", auth: true }),
  addEvidence: (id, ev) => request(`/api/cases/${id}/evidence`, { method: "POST", body: ev, auth: true }),

  // --- Expedientes (estudiantes) ---
  listStudents: () => request("/api/students", { auth: true }),
  getStudent: (id) => request(`/api/students/${id}`, { auth: true }),
  createStudent: (s) => request("/api/students", { method: "POST", body: s, auth: true }),
  bulkStudents: (students) => request("/api/students/bulk", { method: "POST", body: { students }, auth: true }),
  updateStudent: (id, s) => request(`/api/students/${id}`, { method: "PATCH", body: s, auth: true }),
  addEntrevista: (id, e) => request(`/api/students/${id}/entrevistas`, { method: "POST", body: e, auth: true }),
  addCitacion: (id, c) => request(`/api/students/${id}/citaciones`, { method: "POST", body: c, auth: true }),
  addCompromiso: (id, texto) => request(`/api/students/${id}/compromisos`, { method: "POST", body: { texto }, auth: true }),
  setCompromiso: (cid, cumplido) => request(`/api/students/compromisos/${cid}`, { method: "PATCH", body: { cumplido }, auth: true }),
  addMedida: (id, m) => request(`/api/students/${id}/medidas`, { method: "POST", body: m, auth: true }),
  deleteStudent: (id) => request(`/api/students/${id}`, { method: "DELETE", auth: true }),
  deleteCase: (id) => request(`/api/cases/${id}`, { method: "DELETE", auth: true }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE", auth: true }),

  // --- Registros genéricos del expediente (inspectoría, PIE, apoderados) ---
  addStudentRecord: (sid, kind, data) => request(`/api/students/${sid}/records`, { method: "POST", body: { kind, data }, auth: true }),
  updateStudentRecord: (rid, data) => request(`/api/students/records/${rid}`, { method: "PATCH", body: { data }, auth: true }),
  deleteStudentRecord: (rid) => request(`/api/students/records/${rid}`, { method: "DELETE", auth: true }),

  // --- Motor de protocolos (recomienda desde el manual) ---
  protocolAiStatus: () => request("/api/protocols/status", { auth: true }),
  recommendProtocol: (typeLabel, nationalSteps, manualText) => request("/api/protocols/recommend", { method: "POST", body: { typeLabel, nationalSteps, manualText }, auth: true }),

  // --- Auditoría (Ley 21.719) ---
  listAudit: (limit = 200) => request(`/api/audit?limit=${limit}`, { auth: true }),

  // --- Establecimientos (panel Súper Admin) ---
  listEstablishments: () => request("/api/establishments", { auth: true }),
  createEstablishment: (e) => request("/api/establishments", { method: "POST", body: e, auth: true }),
  updateEstablishment: (id, e) => request(`/api/establishments/${id}`, { method: "PATCH", body: e, auth: true }),

  // --- Instituciones de derivación ---
  listInstitutions: () => request("/api/institutions", { auth: true }),
  createInstitution: (i) => request("/api/institutions", { method: "POST", body: i, auth: true }),
  updateInstitution: (id, i) => request(`/api/institutions/${id}`, { method: "PATCH", body: i, auth: true }),
  deleteInstitution: (id) => request(`/api/institutions/${id}`, { method: "DELETE", auth: true }),

  // --- Administración: estado del sistema y respaldo ---
  adminStatus: () => request("/api/admin/status", { auth: true }),
  downloadBackup: async () => {
    const res = await fetch(API_URL + "/api/admin/backup", { headers: { Authorization: "Bearer " + getToken() } });
    if (!res.ok) throw await res.json().catch(() => ({ error: "No se pudo generar el respaldo." }));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respaldo-recupera-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  runBackup: () => request("/api/admin/run-backup", { method: "POST", auth: true }),

  // --- Registros a nivel establecimiento (mensajes, agenda, gestiones, documental, PME) ---
  listOrgRecords: () => request("/api/org/records", { auth: true }),
  addOrgRecord: (kind, data, opts = {}) => {
    const o = typeof opts === "boolean" ? { global: opts } : opts;
    return request("/api/org/records", { method: "POST", body: { kind, data, global: o.global, establishmentId: o.establishmentId }, auth: true });
  },
  updateOrgRecord: (id, data) => request(`/api/org/records/${id}`, { method: "PATCH", body: { data }, auth: true }),
  deleteOrgRecord: (id) => request(`/api/org/records/${id}`, { method: "DELETE", auth: true }),
};
