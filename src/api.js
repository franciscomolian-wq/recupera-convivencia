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
};
