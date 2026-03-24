// services/api.js
// Wrapper centralizado para todas las llamadas al backend.
// Lee el token desde el contexto — nunca desde localStorage.

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || 'Error de red');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const authApi = {
  login: (email, password) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

export const chatApi = {
  enviar: (mensaje, conversacionId, token) =>
    apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ mensaje, conversacionId }) }, token),
};
