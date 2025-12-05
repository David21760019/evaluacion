// js/doctores.js
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

document.addEventListener('DOMContentLoaded', () => {
  const listaDoctores = qs('#lista-doctores');
  const btnNuevoDoc = qs('#btn-nuevo-doctor');
  const panelDoc = qs('#panel-doctor');
  const formDoc = qs('#form-doctor');
  const filtroEsp = qs('#filtro-especialidad');
  const diasCont = qs('#dias-checkboxes');
  const msgDoc = qs('#mensaje-doctor');
  const panelAgenda = qs('#panel-agenda');
  const agendaList = qs('#agenda-list');
  const agendaHeader = qs('#agenda-header');
  const btnCerrarAgenda = qs('#cerrar-agenda');

  if (!listaDoctores || !formDoc) return;

  const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  let doctoresCache = [];

  function createDiasCheckboxes(){
    if (!diasCont) return;
    diasCont.innerHTML = DIAS.map(d=>`<label><input type="checkbox" value="${d}" /> ${d}</label>`).join('');
  }
  createDiasCheckboxes();

  async function loadDoctores(){
    listaDoctores.innerHTML = 'Cargando...';
    try {
      doctoresCache = await API.doctores();
      renderDoctores(doctoresCache);
      populateEspecialidades(doctoresCache);
    } catch (err) {
      listaDoctores.innerHTML = `<div class="msg">❌ ${err.error || 'Error cargando doctores'}</div>`;
    }
  }

  function renderDoctores(list){
    if (!listaDoctores) return;
    if (!list.length) { listaDoctores.innerHTML = '<div class="muted">No hay doctores registrados.</div>'; return; }
    listaDoctores.innerHTML = list.map(d => `
      <div class="card-small">
        <div>
          <div><strong>${d.nombre}</strong> <small class="muted">(${d.especialidad})</small></div>
          <div class="muted">${d.horarioInicio} - ${d.horarioFin} • ${d.diasDisponibles.join(', ')}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn ver-agenda" data-id="${d.id}">Agenda</button>
          <button class="btn editar-doc" data-id="${d.id}">Editar</button>
        </div>
      </div>
    `).join('');

    qsa('.ver-agenda').forEach(b=>b.addEventListener('click', async (ev)=>{
      const id = ev.currentTarget.dataset.id;
      try {
        const d = await API.doctor(id);
        if (agendaHeader) agendaHeader.innerHTML = `<h3>${d.nombre} — ${d.especialidad}</h3>`;
        const all = await API.citas();
        const citas = (all || []).filter(c => c.doctorId === id);
        if (agendaList) agendaList.innerHTML = citas.length ? citas.map(c=>`<div class="card-small">${c.fecha} ${c.hora} • ${c.pacienteId} • ${c.estado}</div>`).join('') : '<div class="muted">Sin citas</div>';
        if (panelAgenda) panelAgenda.classList.remove('hidden');
      } catch (err) {
        if (msgDoc) msgDoc.innerHTML = `❌ ${err.error || 'Error cargando agenda'}`;
      }
    }));

    qsa('.editar-doc').forEach(b=>b.addEventListener('click', async (ev)=>{
      const id = ev.currentTarget.dataset.id;
      try {
        const d = await API.doctor(id);
        qs('#d-nombre').value = d.nombre || '';
        qs('#d-especialidad').value = d.especialidad || '';
        qs('#d-horario-inicio').value = d.horarioInicio || '09:00';
        qs('#d-horario-fin').value = d.horarioFin || '17:00';
        qsa('#dias-checkboxes input').forEach(inp => inp.checked = d.diasDisponibles.includes(inp.value));
        if (panelDoc) panelDoc.dataset.editId = id;
        qs('#form-doctor-title').textContent = 'Editar Doctor (no persistido si backend no soporta PUT)';
        if (panelDoc) panelDoc.classList.remove('hidden');
      } catch (err) {
        if (msgDoc) msgDoc.innerHTML = `❌ ${err.error || 'Error cargando doctor'}`;
      }
    }));
  }

  function populateEspecialidades(list){
    if (!filtroEsp) return;
    const uniq = Array.from(new Set((list || []).map(d=>d.especialidad))).sort();
    filtroEsp.innerHTML = `<option value="">Filtrar por especialidad</option>` + uniq.map(s=>`<option value="${s}">${s}</option>`).join('');
    const selectEsp = qs('#d-especialidad');
    if(selectEsp){
      selectEsp.innerHTML = uniq.map(s=>`<option value="${s}">${s}</option>`).join('') + '<option value="">Otro</option>';
    }
  }

  if (btnNuevoDoc) btnNuevoDoc.addEventListener('click', ()=>{ if (panelDoc) panelDoc.classList.remove('hidden'); formDoc.reset(); qsa('#dias-checkboxes input').forEach(i=>i.checked=false); });
  const btnCancelarDoc = qs('#btn-cancelar-doctor');
  if (btnCancelarDoc) btnCancelarDoc.addEventListener('click', ()=>{ if(panelDoc) panelDoc.classList.add('hidden'); });

  formDoc.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const nombre = qs('#d-nombre').value.trim();
    const especialidad = qs('#d-especialidad').value.trim();
    const horarioInicio = qs('#d-horario-inicio').value;
    const horarioFin = qs('#d-horario-fin').value;
    const dias = qsa('#dias-checkboxes input:checked').map(i=>i.value);

    if (!nombre || !especialidad) { if (msgDoc) msgDoc.innerHTML = '❌ Nombre y especialidad son obligatorios'; return; }
    if (horarioInicio >= horarioFin) { if (msgDoc) msgDoc.innerHTML = '❌ El horario de inicio debe ser menor que el de fin'; return; }
    if (!dias.length) { if (msgDoc) msgDoc.innerHTML = '❌ Selecciona al menos un día'; return; }

    try {
      const nuevo = { nombre, especialidad, horarioInicio, horarioFin, diasDisponibles: dias };
      await API.crearDoctor(nuevo);
      if (msgDoc) msgDoc.innerHTML = '✅ Doctor creado';
      if (panelDoc) panelDoc.classList.add('hidden');
      loadDoctores();
    } catch (err) {
      if (msgDoc) msgDoc.innerHTML = `❌ ${err.error || JSON.stringify(err)}`;
    }
  });

  if (btnCerrarAgenda) btnCerrarAgenda.addEventListener('click', ()=>{ if(panelAgenda) panelAgenda.classList.add('hidden'); });

  if (filtroEsp) filtroEsp.addEventListener('change', async ()=>{
    const val = filtroEsp.value;
    if (!val) return renderDoctores(doctoresCache);
    try {
      const docs = await API.doctoresPorEspecialidad(val);
      renderDoctores(docs);
    } catch (err) {
      if (msgDoc) msgDoc.innerHTML = `❌ ${err.error || 'Error filtrando'}`;
    }
  });

  loadDoctores();
});
