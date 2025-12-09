# Sistema de Gestión de Citas Médicas

Este proyecto es una aplicación sencilla construida con **Node.js + Express** para gestionar:

- Pacientes  
- Doctores  
- Citas médicas  

El backend utiliza archivos JSON como base de datos local y expone una API REST para ser consumida desde un frontend.

---

## Tecnologías utilizadas

### **Backend**
- **Node.js**
- **Express**
- **UUID** (generación de IDs)
- **CORS**
- **File System (fs)** — lectura/escritura de JSON
- **ES Modules (import/export)**

### **Frontend (según tu proyecto)**
- HTML / CSS / JavaScript
- Fetch API para consumir el backend

---


---

## 🔧 Instalación

1. Clona el repositorio o descarga los archivos:

-git clone https://github.com/usuario/proyecto-citas.git
cd proyecto-citas

2. Instala dependencias:

npm install

Instala dependencias:v
{
  "dependencies": {
    "express": "^4.x",
    "cors": "^2.x",
    "uuid": "^9.x"
  },
  "type": "module"
}

<img width="1919" height="932" alt="image" src="https://github.com/user-attachments/assets/6efaf56e-4aab-40e8-9c37-21a19ca2a1c0" />

<img width="1910" height="908" alt="image" src="https://github.com/user-attachments/assets/6efe4010-013c-451a-a224-2b8c9e205b61" />

<img width="1919" height="882" alt="image" src="https://github.com/user-attachments/assets/ef66de1d-7364-4b48-b59b-038132395b13" />

<img width="1919" height="866" alt="image" src="https://github.com/user-attachments/assets/d2d66196-4761-422e-82c7-9ef301cd0fda" />


Se puede navegar al detalle desde la lista de resultados.

Endpoints Consumidos y Su Uso
 Pacientes
Método	Endpoint	Descripción
GET	/pacientes	Obtener todos los pacientes
GET	/pacientes/:id	Obtener un paciente específico
POST	/pacientes	Crear un nuevo paciente
PUT	/pacientes/:id	Editar paciente
DELETE	/pacientes/:id	Eliminar paciente

Ejemplo: Crear paciente

API.crearPaciente({
  nombre: "Juan Pérez",
  edad: 35,
  telefono: "5522334455",
  email: "juan@mail.com"
});

 Doctores
Método	Endpoint	Descripción
GET	/doctores	Obtener todos los doctores
GET	/doctores/:id	Obtener un doctor
GET	/doctores/especialidad/:esp	Filtrar doctores por especialidad
POST	/doctores	Crear doctor

Ejemplo: Filtrar por especialidad

API.doctoresPorEspecialidad("Cardiología");

Citas
Método	Endpoint	Descripción
GET	/citas	Todas las citas
GET	/citas?fecha=YYYY-MM-DD	Citas por fecha
GET	/citas/:id	Ver una cita
POST	/citas	Crear nueva cita
PUT	/citas/:id/cancelar	Cancelar cita

Ejemplo: Citas del día

API.citas(`?fecha=${API.hoy()}`);




