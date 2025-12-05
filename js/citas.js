// js/citas.js
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

document.addEventListener('DOMContentLoaded', () => {
  const tablaCitasBody = qs('#tabla-citas tbody');
  const btnNuevaCita = qs('#btn-nueva-cita');
  const panelCita = qs('#panel-cita');
  const formCita = qs('#form-cita');
  const msgCitas = qs('#mensaje-citas');
  const selectPaciente = qs('#c-paciente');
  const selectEspecialidad = qs('#c-especialidad');
  const selectDoctor = qs('#c-doctor');
  const inputFecha = qs('#c-fecha');
  const inputHora = qs('#c-hora');
  const btnCancelarCita = qs('#btn-cancelar-cita');
  const panelDetalle = qs('#panel-detalle-cita');
  const filtroFecha = qs('#filtro-fecha');
  const filtroEstado = qs('#filtro-estado');
  const btnCerrarDetalle = qs('#cerrar-detalle');

  if (!formCita || !tablaCitasBody) return;

  async function loadCitas(){
  tablaCitasBody.innerHTML = '<tr><td colspan="9">Cargando...</td></tr>';

  try {
    const fecha = filtroFecha ? filtroFecha.value : '';
    const estado = filtroEstado ? filtroEstado.value : '';
    const q = `?${fecha ? 'fecha='+fecha : ''}${fecha && estado ? '&' : ''}${estado ? 'estado='+estado : ''}`;

    // ⬅️ PRIMERO OBTENEMOS TODO LO NECESARIO
    const [citas, pacientes, doctores] = await Promise.all([
      API.citas(q),
      API.pacientes(),
      API.doctores()
    ]);

    if (!citas || !citas.length) {
      tablaCitasBody.innerHTML = '<tr><td colspan="9" class="muted">No hay citas</td></tr>';
      return;
    }

    // ⬅️ RENDER CORREGIDO
    tablaCitasBody.innerHTML = citas.map(c => {
      const pac = pacientes.find(p => p.id === c.pacienteId);
      const doc = doctores.find(d => d.id === c.doctorId);

      return `
        <tr>
          <td>${c.id}</td>
          <td>${c.fecha}</td>
          <td>${c.hora}</td>
          <td>${pac ? pac.nombre : c.pacienteId}</td>
          <td>${doc ? doc.nombre : c.doctorId}</td>
          <td>${doc ? doc.especialidad : 'N/A'}</td>
          <td>${c.motivo}</td>
          <td>${c.estado}</td>
          <td>
            <button class="btn ver-cita" data-id="${c.id}">Ver</button>
            ${c.estado === 'programada' ? `<button class="btn cancelar-cita" data-id="${c.id}">Cancelar</button>` : ''}
          </td>
        </tr>`;
    }).join('');

    attachCitaEvents();

  } catch (err) {
    tablaCitasBody.innerHTML = `<tr><td colspan="9" class="msg">❌ ${err.error || 'Error cargando citas'}</td></tr>`;
  }
}


  function attachCitaEvents(){
    qsa('.ver-cita').forEach(b=>b.addEventListener('click', async (ev)=>{
      const id = ev.currentTarget.dataset.id;
      try {
        const c = await API.cita(id);
        if (panelDetalle) panelDetalle.classList.remove('hidden');
        const detalle = qs('#detalle-cita-contenido');
        if (detalle) detalle.innerHTML = `<pre>${JSON.stringify(c,null,2)}</pre>
          <div style="margin-top:8px">
            ${c.estado === 'programada' ? `<button id="det-cancel" class="btn">Cancelar Cita</button>` : ''}
          </div>`;
        if (c.estado === 'programada') {
          const detCancel = qs('#det-cancel');
          if (detCancel) detCancel.addEventListener('click', async ()=>{
            if (!confirm('¿Está seguro de cancelar esta cita?')) return;
            try {
              await API.cancelarCita(id);
              if (msgCitas) msgCitas.innerHTML = '✅ Cita cancelada';
              if (panelDetalle) panelDetalle.classList.add('hidden');
              loadCitas();
            } catch (err) { if (msgCitas) msgCitas.innerHTML = `❌ ${err.error || 'Error cancelando'}`; }
          });
        }
      } catch (err) { if (msgCitas) msgCitas.innerHTML = `❌ ${err.error || 'Error cargando cita'}`; }
    }));

    qsa('.cancelar-cita').forEach(b=>b.addEventListener('click', async (ev)=>{
      const id = ev.currentTarget.dataset.id;
      if (!confirm('¿Seguro que quieres cancelar esta cita?')) return;
      try {
        await API.cancelarCita(id);
        if (msgCitas) msgCitas.innerHTML = '✅ Cita cancelada';
        loadCitas();
      } catch (err) {
        if (msgCitas) msgCitas.innerHTML = `❌ ${err.error || 'Error cancelando'}`;
      }
    }));
  }

  if (btnNuevaCita) btnNuevaCita.addEventListener('click', async () => {
    try {
      const [pacientes, doctores] = await Promise.all([API.pacientes(), API.doctores()]);
      if (selectPaciente) selectPaciente.innerHTML = pacientes.map(p=>`<option value="${p.id}">${p.nombre} (${p.id})</option>`).join('');
      const esp = Array.from(new Set((doctores || []).map(d=>d.especialidad))).sort();
      if (selectEspecialidad) selectEspecialidad.innerHTML = `<option value="">--</option>` + esp.map(e=>`<option value="${e}">${e}</option>`).join('');
      if (panelCita) panelCita.classList.remove('hidden');
      if (inputFecha) inputFecha.min = API.hoy();
    } catch (err) {
      if (msgCitas) msgCitas.innerHTML = `❌ ${err.error || 'Error preparando formulario'}`;
    }
  });

  if (btnCancelarCita) btnCancelarCita.addEventListener('click', ()=> { if (panelCita) panelCita.classList.add('hidden'); });

  if (selectEspecialidad) selectEspecialidad.addEventListener('change', async ()=>{
    const esp = selectEspecialidad.value;
    if (selectDoctor) selectDoctor.innerHTML = '<option>Cargando...</option>';
    if (!esp) { if (selectDoctor) selectDoctor.innerHTML = '<option value="">--</option>'; return; }
    try {
      const docs = await API.doctoresPorEspecialidad(esp);
      if (selectDoctor) selectDoctor.innerHTML = '<option value="">--</option>' + (docs || []).map(d=>`<option value="${d.id}" data-hini="${d.horarioInicio}" data-hfin="${d.horarioFin}">${d.nombre} (${d.horarioInicio}-${d.horarioFin})</option>`).join('');
    } catch (err) {
      if (selectDoctor) selectDoctor.innerHTML = '<option value="">--</option>';
      if (msgCitas) msgCitas.innerHTML = `❌ ${err.error || 'Error cargando doctores'}`;
    }
  });

  async function checkDisponibilidad(){
    if (!inputFecha || !inputHora || !selectDoctor) return false;
    const fecha = inputFecha.value;
    const hora = inputHora.value;
    const doctorId = selectDoctor.value;
    if (!fecha || !hora || !doctorId) return false;
    try {
      const disponibles = await API.doctoresDisponibles(fecha, hora);
      const ok = (disponibles || []).some(d => d.id === doctorId);
      if (!ok) {
        const el = qs('#err-c-hora');
        if (el) el.textContent = 'El doctor no está disponible en esa fecha/hora';
        return false;
      } else {
        const el = qs('#err-c-hora');
        if (el) el.textContent = '';
        return true;
      }
    } catch (err) {
      const el = qs('#err-c-hora');
      if (el) el.textContent = err.error || 'Error validando disponibilidad';
      return false;
    }
  }

  if (inputFecha) inputFecha.addEventListener('change', ()=>{ const el = qs('#err-c-fecha'); if (el) el.textContent=''; });
  if (inputHora) inputHora.addEventListener('change', checkDisponibilidad);
  if (selectDoctor) selectDoctor.addEventListener('change', checkDisponibilidad);

  formCita.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    qsa('.error').forEach(e=>e.textContent='');
    const pacienteId = selectPaciente ? selectPaciente.value : '';
    const especialidad = selectEspecialidad ? selectEspecialidad.value : '';
    const doctorId = selectDoctor ? selectDoctor.value : '';
    const fecha = inputFecha ? inputFecha.value : '';
    const hora = inputHora ? inputHora.value : '';
    const motivoEl = qs('#c-motivo');
    const motivo = motivoEl ? motivoEl.value.trim() : '';

    if (!pacienteId) { const el = qs('#err-c-paciente'); if (el) el.textContent='Selecciona un paciente'; return; }
    if (!especialidad) { const el = qs('#err-c-especialidad'); if (el) el.textContent='Selecciona una especialidad'; return; }
    if (!doctorId) { const el = qs('#err-c-doctor'); if (el) el.textContent='Selecciona un doctor'; return; }
    const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00');
    if (!fecha || new Date(fecha + 'T00:00') <= today) { const el = qs('#err-c-fecha'); if (el) el.textContent='La fecha debe ser futura'; return; }
    if (!hora) { const el = qs('#err-c-hora'); if (el) el.textContent='Selecciona una hora'; return; }
    if (!motivo) { const el = qs('#err-c-motivo'); if (el) el.textContent='El motivo es requerido'; return; }

    const disp = await checkDisponibilidad();
    if (!disp) return;

    try {
      const body = { pacienteId, doctorId, fecha, hora, motivo };
      await API.crearCita(body);
      if (msgCitas) msgCitas.innerHTML = '✅ Cita agendada correctamente';
      if (panelCita) panelCita.classList.add('hidden');
      loadCitas();
    } catch (err) {
      if (msgCitas) msgCitas.innerHTML = `❌ ${err.error || JSON.stringify(err)}`;
    }
  });

  if (filtroFecha) filtroFecha.addEventListener('change', loadCitas);
  if (filtroEstado) filtroEstado.addEventListener('change', loadCitas);
  if (btnCerrarDetalle) btnCerrarDetalle.addEventListener('click', ()=>{ if(panelDetalle) panelDetalle.classList.add('hidden'); });

  loadCitas();
});
