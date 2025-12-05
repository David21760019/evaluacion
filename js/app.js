// js/app.js
// util helpers
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

document.addEventListener('DOMContentLoaded', async () => {
  const elPac = qs('#stat-pacientes');
  const elDoc = qs('#stat-doctores');
  const elCitasHoy = qs('#stat-citas-hoy');
  const el24 = qs('#stat-citas-24h');
  const elList = qs('#citas-today');

  if (!elPac || !elDoc || !elCitasHoy || !el24 || !elList) return; // página puede no tener dashboard

  try {
    const [pacientes, doctores] = await Promise.all([API.pacientes(), API.doctores()]);
    elPac.textContent = pacientes.length;
    elDoc.textContent = doctores.length;

    const hoy = API.hoy();
    const citasHoy = await API.citas(`?fecha=${hoy}`);
    elCitasHoy.textContent = citasHoy.length;

    const mañana = new Date(); mañana.setDate(mañana.getDate()+1);
    const mStr = mañana.toISOString().split('T')[0];
    const citas24 = (await API.citas()).filter(c => c.fecha === hoy || c.fecha === mStr);
    el24.textContent = citas24.length;

    elList.innerHTML = citasHoy.length === 0 ? `<div class="muted">No hay citas para hoy</div>` :
      citasHoy.map(c => `<div class="item">
        <div>
          <div><strong>${c.hora}</strong> • ${c.pacienteId} • ${c.doctorId}</div>
          <div class="muted">${c.motivo}</div>
        </div>
        <div>${c.estado === 'programada' ? '<span style="color:var(--success)">Programada</span>' : '<span style="color:var(--danger)">Cancelada</span>'}</div>
      </div>`).join('');
  } catch (err) {
    elList.innerHTML = `<div class="msg">❌ ${err.error || 'Error cargando dashboard'}</div>`;
  }
});
