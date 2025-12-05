// js/pacientes.js
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

document.addEventListener('DOMContentLoaded', () => {
  const listaPacientes = qs('#lista-pacientes');
  const btnNuevo = qs('#btn-nuevo-paciente');
  const panel = qs('#panel-paciente');
  const form = qs('#form-paciente');
  const msg = qs('#mensaje');
  const buscarInput = qs('#buscar-paciente');
  const panelHist = qs('#panel-historial');
  const tablaHist = qs('#tabla-historial tbody');
  const histHeader = qs('#hist-header');
  const btnCerrarHist = qs('#cerrar-historial');
  if (!listaPacientes || !form) return; // página no es pacientes

  let pacientesCache = [];

  function clearErrors(){
    qsa('.error').forEach(e=>e.textContent='');
  }
  function validatePaciente(data){
    clearErrors();
    let ok = true;
    if (!data.nombre || data.nombre.trim().length < 3){ qs('#err-nombre').textContent='Nombre mínimo 3 caracteres'; ok=false; }
    if (!data.edad || Number(data.edad) < 1){ qs('#err-edad').textContent='Edad debe ser mayor a 0'; ok=false; }
    if (!data.telefono || data.telefono.replace(/\D/g,'').length < 10){ qs('#err-telefono').textContent='Teléfono mínimo 10 dígitos'; ok=false; }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(data.email)){ qs('#err-email').textContent='Email no válido'; ok=false; }
    return ok;
  }

  function showPanel(editId) {
    if (!panel) return;
    panel.classList.remove('hidden');
    if (editId) panel.dataset.editId = editId;
  }
  function hidePanel(){
    if (!panel) return;
    panel.classList.add('hidden');
    delete panel.dataset.editId;
    form.reset();
    clearErrors();
  }
  function showHist() { if (panelHist) panelHist.classList.remove('hidden'); }
  function hideHist() { if (panelHist) { panelHist.classList.add('hidden'); tablaHist.innerHTML = ''; histHeader.innerHTML = ''; } }

  async function loadPacientes(){
    if (!listaPacientes) return;
    listaPacientes.innerHTML = 'Cargando...';
    try {
      pacientesCache = await API.pacientes();
      renderPacientes(pacientesCache);
    } catch (err) {
      listaPacientes.innerHTML = `<div class="msg">❌ ${err.error || 'Error cargando pacientes'}</div>`;
    }
  }

  function renderPacientes(list){
    if (!listaPacientes) return;
    if (!list || !list.length) { listaPacientes.innerHTML = '<div class="muted">No hay pacientes registrados. ¡Agrega el primero!</div>'; return; }
    listaPacientes.innerHTML = list.map(p => `
      <div class="card-small">
        <div>
          <div><strong>${p.nombre}</strong> <small class="muted">(${p.id})</small></div>
          <div class="muted">${p.email} • ${p.telefono} • ${p.edad} años</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn ver" data-id="${p.id}">Historial</button>
          <button class="btn editar" data-id="${p.id}">Editar</button>
        </div>
      </div>
    `).join('');

    qsa('.ver').forEach(b => b.addEventListener('click', async (ev) => {
  const id = ev.currentTarget.dataset.id;

  try {
    const p = await API.paciente(id);
    const doctores = await API.doctores();
    const all = await API.citas();

    if (histHeader) histHeader.innerHTML = `<h3>${p.nombre} (${p.id})</h3>`;

    const his = (all || []).filter(c => c.pacienteId === id);

    if (!his.length) {
      tablaHist.innerHTML = `<tr>
        <td colspan="6" class="muted">Sin citas registradas</td>
      </tr>`;
    } else {
      tablaHist.innerHTML = his.map(c => {
        const doc = doctores.find(d => d.id === c.doctorId);

        return `
          <tr>
            <td>${c.fecha}</td>
            <td>${c.hora}</td>
            <td>${doc ? doc.nombre : c.doctorId}</td>
            <td>${doc ? doc.especialidad : 'N/A'}</td>
            <td>${c.motivo}</td>
            <td>${c.estado}</td>
          </tr>
        `;
      }).join('');
    }

    showHist();

  } catch (err) {
    if (msg) msg.textContent = `❌ ${err.error || 'Error cargando historial'}`;
  }
}));

    qsa('.editar').forEach(b => b.addEventListener('click', async (ev) => {
      const id = ev.currentTarget.dataset.id;
      try {
        const p = await API.paciente(id);
        qs('#p-nombre').value = p.nombre || '';
        qs('#p-edad').value = p.edad || '';
        qs('#p-telefono').value = p.telefono || '';
        qs('#p-email').value = p.email || '';
        if (panel) panel.dataset.editId = id;
        qs('#form-title').textContent = 'Editar paciente';
        showPanel(id);
      } catch (err) {
        if (msg) msg.innerHTML = `❌ ${err.error || 'Error cargando paciente'}`;
      }
    }));
  }

  if (btnNuevo) btnNuevo.addEventListener('click', ()=>{ qs('#form-title').textContent='Nuevo Paciente'; showPanel(); });
  const btnCancelar = qs('#btn-cancelar');
  if (btnCancelar) btnCancelar.addEventListener('click', hidePanel);

  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const data = {
      nombre: qs('#p-nombre').value.trim(),
      edad: Number(qs('#p-edad').value),
      telefono: qs('#p-telefono').value.trim(),
      email: qs('#p-email').value.trim()
    };
    if (!validatePaciente(data)) return;
    try {
      if (panel && panel.dataset.editId) {
        await API.editarPaciente(panel.dataset.editId, data);
        if (msg) msg.innerHTML = '✅ Paciente actualizado correctamente';
      } else {
        await API.crearPaciente(data);
        if (msg) msg.innerHTML = '✅ Paciente registrado correctamente';
      }
      hidePanel();
      loadPacientes();
    } catch (err) {
      if (msg) msg.innerHTML = `❌ ${err.error || JSON.stringify(err)}`;
    }
  });

  if (buscarInput) {
    buscarInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = pacientesCache.filter(p => p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
      renderPacientes(filtered);
    });
  }

  if (btnCerrarHist) btnCerrarHist.addEventListener('click', hideHist);

  loadPacientes();
});
