const GATEWAY_URL = "http://127.0.0.1:8080";

let usuarioActual = null;
let tokenActual = null;
let mapaClases = {};  

document.getElementById("btn-login").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const respuesta = await fetch(`${GATEWAY_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (!respuesta.ok) {
        document.getElementById("login-mensaje").textContent = "Credenciales inválidas";
        return;
    }

    const datos = await respuesta.json();
    tokenActual = datos.access_token;
    usuarioActual = datos.user;

    const respPerfil = await fetch(`${GATEWAY_URL}/users/me`, {
        headers: { Authorization: `Bearer ${tokenActual}` }
    });
    const perfil = await respPerfil.json();
    usuarioActual.role = perfil.role;

    document.getElementById("usuario-nombre").textContent = usuarioActual.email;
    document.getElementById("login-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";

    if (usuarioActual.role === "ADMINISTRADOR") {
        document.getElementById("admin-section").style.display = "block";
        cargarOpcionesAdmin();
    }

    await cargarClases();
    await cargarMisReservas();
});

    async function cargarClases() {
        const respDisciplinas = await fetch(`${GATEWAY_URL}/disciplines`);
        const disciplinas = await respDisciplinas.json();
        const mapaDisciplinas = {};
        disciplinas.forEach(d => mapaDisciplinas[d.id] = d.nombre);

        const respClases = await fetch(`${GATEWAY_URL}/classes`);
        const clases = await respClases.json();

        const lista = document.getElementById("lista-clases");
        lista.innerHTML = "";

        clases.forEach(clase => {
            mapaClases[clase.id] = `${mapaDisciplinas[clase.discipline_id]} — ${clase.day_of_week} ${clase.start_time}`;
            const li = document.createElement("li");
            li.textContent = `${mapaDisciplinas[clase.discipline_id]} — ${clase.day_of_week} ${clase.start_time} (cupo ${clase.capacity}) `;

            const btnReservar = document.createElement("button");
            btnReservar.textContent = "Reservar";
            btnReservar.addEventListener("click", () => reservarClase(clase.id));

            li.appendChild(btnReservar);
            lista.appendChild(li);
        });
    }

    async function reservarClase(classId) {
        const respuesta = await fetch(`${GATEWAY_URL}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ class_id: classId, student_id: usuarioActual.id })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            alert(datos.mensaje);
            return;
        }

        alert("Reserva creada");
        cargarMisReservas();
    }

    async function cargarMisReservas() {
        const respuesta = await fetch(`${GATEWAY_URL}/bookings?studentId=${usuarioActual.id}`);
        const reservas = await respuesta.json();

        const lista = document.getElementById("lista-reservas");
        lista.innerHTML = "";

        reservas.filter(r => r.status === "active").forEach(reserva => {
            const li = document.createElement("li");
            li.textContent = `Reserva #${reserva.id} — ${mapaClases[reserva.class_id] || "Clase " + reserva.class_id} `;

            const btnCancelar = document.createElement("button");
            btnCancelar.textContent = "Cancelar";
            btnCancelar.addEventListener("click", () => cancelarReserva(reserva.id));

            li.appendChild(btnCancelar);
            lista.appendChild(li);
        });
    }

    async function cancelarReserva(id) {
        await fetch(`${GATEWAY_URL}/bookings/${id}`, { method: "DELETE" });
        cargarMisReservas();
    }

    async function cargarOpcionesAdmin() {
    const respDisciplinas = await fetch(`${GATEWAY_URL}/disciplines`);
    const disciplinas = await respDisciplinas.json();

    const selectDisciplina = document.getElementById("admin-clase-disciplina");
    selectDisciplina.innerHTML = "";
    disciplinas.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = d.nombre;
        selectDisciplina.appendChild(option);
    });

    const respProfesores = await fetch(`${GATEWAY_URL}/users?role=PROFESOR`);
    const profesores = await respProfesores.json();

    const selectProfesor = document.getElementById("admin-clase-profesor");
    selectProfesor.innerHTML = "";
    profesores.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nombre;
        selectProfesor.appendChild(option);
    });
}

document.getElementById("btn-crear-disciplina").addEventListener("click", async () => {
    const nombre = document.getElementById("admin-disciplina-nombre").value;

    const respuesta = await fetch(`${GATEWAY_URL}/disciplines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        document.getElementById("admin-disciplina-mensaje").textContent = datos.mensaje;
        return;
    }

    document.getElementById("admin-disciplina-mensaje").textContent = "Disciplina creada";
    document.getElementById("admin-disciplina-nombre").value = "";
    cargarOpcionesAdmin();
});

document.getElementById("btn-crear-clase").addEventListener("click", async () => {
    const discipline_id = document.getElementById("admin-clase-disciplina").value;
    const professor_id = document.getElementById("admin-clase-profesor").value;
    const day_of_week = document.getElementById("admin-clase-dia").value;
    const start_time = document.getElementById("admin-clase-hora").value;
    const duration_minutes = Number(document.getElementById("admin-clase-duracion").value);
    const capacity = Number(document.getElementById("admin-clase-cupo").value);

    const respuesta = await fetch(`${GATEWAY_URL}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discipline_id, professor_id, day_of_week, start_time, duration_minutes, capacity })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        document.getElementById("admin-clase-mensaje").textContent = datos.mensaje;
        return;
    }

    document.getElementById("admin-clase-mensaje").textContent = "Clase creada";
    cargarClases();
});