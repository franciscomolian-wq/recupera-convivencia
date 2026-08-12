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
  updateStudent: (id, s) => request(`/api/students/${id}`, { method: "PATCH", body: s, auth: true }),
  addEntrevista: (id, e) => request(`/api/students/${id}/entrevistas`, { method: "POST", body: e, auth: true }),
  addCitacion: (id, c) => request(`/api/students/${id}/citaciones`, { method: "POST", body: c, auth: true }),
  addCompromiso: (id, texto) => request(`/api/students/${id}/compromisos`, { method: "POST", body: { texto }, auth: true }),
  setCompromiso: (cid, cumplido) => request(`/api/students/compromisos/${cid}`, { method: "PATCH", body: { cumplido }, auth: true }),
  addMedida: (id, m) => request(`/api/students/${id}/medidas`, { method: "POST", body: m, auth: true }),
};
