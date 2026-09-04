const express = require("express");

const supabase = require("./supabaseClient");

const app = express();
app.use(express.json());

const PORT = 3002;

app.get("/", (req, res) => {
    res.json({ mensaje: "Booking Service funcionando" });
});

app.get("/bookings", async (req, res) => {
    const { studentId, classId } = req.query;

    let query = supabase.from("bookings").select("*");

    if (studentId) query = query.eq("student_id", studentId);
    if (classId) query = query.eq("class_id", classId);

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ mensaje: "Error al obtener reservas", error: error.message });
    }

    res.json(data);
});

app.post("/bookings", async (req, res) => {
    const { class_id, student_id } = req.body;

    const respuestaUsuario = await fetch(`${process.env.USERS_SERVICE_URL}/users/${student_id}`);
    if (!respuestaUsuario.ok) {
        return res.status(400).json({ mensaje: "El estudiante indicado no existe" });
    }
    const usuario = await respuestaUsuario.json();
    if (usuario.role !== "ESTUDIANTE") {
        return res.status(400).json({ mensaje: "El usuario indicado no tiene rol de estudiante" });
    }

    const respuestaClase = await fetch(`${process.env.CLASSES_SERVICE_URL}/classes/${class_id}`);
    if (!respuestaClase.ok) {
        return res.status(400).json({ mensaje: "La clase indicada no existe" });
    }
    const clase = await respuestaClase.json();

    const { data: reservaExistente, error: errorExistente } = await supabase
        .from("bookings")
        .select("id")
        .eq("class_id", class_id)
        .eq("student_id", student_id)
        .eq("status", "active")
        .maybeSingle();

    if (errorExistente) {
        return res.status(500).json({ mensaje: "Error al verificar reserva existente", error: errorExistente.message });
    }
    if (reservaExistente) {
        return res.status(409).json({ mensaje: "Ya tienes una reserva activa en esta clase" });
    }

    const { data: reservasActivas, error: errorConteo } = await supabase
        .from("bookings")
        .select("id")
        .eq("class_id", class_id)
        .eq("status", "active");

    if (errorConteo) {
        return res.status(500).json({ mensaje: "Error al verificar cupo", error: errorConteo.message });
    }
    if (reservasActivas.length >= clase.capacity) {
        return res.status(409).json({ mensaje: "Clase llena" });
    }

    const { data, error } = await supabase
        .from("bookings")
        .insert({ class_id, student_id })
        .select()
        .single();

    if (error) {
        return res.status(400).json({ mensaje: "Error al crear reserva", error: error.message });
    }

    res.status(201).json(data);
});

app.delete("/bookings/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return res.status(404).json({ mensaje: "Reserva no encontrada" });
    }

    res.json({ mensaje: "Reserva cancelada", reserva: data });
});

app.listen(PORT, () => {
    console.log(`Booking Service ejecutándose en http://localhost:${PORT}`);
});