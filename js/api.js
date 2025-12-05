// js/api.js
const API_BASE = 'https://fibrinous-temple-probatively.ngrok-free.dev'; // <- cambia si tu backend está en otra URL

async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };
  try {
    const res = await fetch(url, { headers: defaultHeaders, ...opts });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw data || { error: `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    if (err && err.error) throw err;
    throw { error: err.message || 'Error en la petición' };
  }
}

const API = {
  pacientes: () => apiFetch('/pacientes'),
  paciente: (id) => apiFetch(`/pacientes/${id}`),
  crearPaciente: (body) => apiFetch('/pacientes', { method: 'POST', body: JSON.stringify(body) }),
  editarPaciente: (id, body) => apiFetch(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  doctores: () => apiFetch('/doctores'),
  doctoresPorEspecialidad: (esp) => apiFetch(`/doctores/especialidad/${encodeURIComponent(esp)}`),
  crearDoctor: (body) => apiFetch('/doctores', { method: 'POST', body: JSON.stringify(body) }),
  doctor: (id) => apiFetch(`/doctores/${id}`),
  doctoresDisponibles: (fecha, hora) => apiFetch(`/doctores/disponibles?fecha=${fecha}&hora=${hora}`),

  citas: (query='') => apiFetch(`/citas${query}`),
  cita: (id) => apiFetch(`/citas/${id}`),
  crearCita: (body) => apiFetch('/citas', { method: 'POST', body: JSON.stringify(body) }),
  cancelarCita: (id) => apiFetch(`/citas/${id}/cancelar`, { method: 'PUT' }),

  // helper: fecha hoy en ISO YYYY-MM-DD
  hoy: () => new Date().toISOString().split('T')[0]
};
