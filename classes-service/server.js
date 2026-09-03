const express = require("express");

const supabase = require("./supabaseClient");

const app = express();
app.use(express.json());

const PORT = 3001;

app.get("/", (req, res) => {
    res.json({
        mensaje: "Classes Service funcionando"
    });
});

app.get("/disciplines", async (req, res) => {
    const { data, error } = await supabase
        .from("disciplines")
        .select("*");

    if (error) {
        return res.status(500).json({ mensaje: "Error al obtener disciplinas", error: error.message });
    }

    res.json(data);
});

app.post("/disciplines", async (req, res) => {
    const { nombre } = req.body;

    const { data, error } = await supabase
        .from("disciplines")
        .insert({ nombre })
        .select()
        .single();

    if (error) {
        return res.status(400).json({ mensaje: "Error al crear disciplina", error: error.message });
    }

    res.status(201).json(data);
});

app.put("/disciplines/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;

    const { data, error } = await supabase
        .from("disciplines")
        .update({ nombre })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return res.status(404).json({ mensaje: "Disciplina no encontrada" });
    }

    res.json(data);
});

app.delete("/disciplines/:id", async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from("disciplines")
        .delete()
        .eq("id", id);

    if (error) {
        return res.status(404).json({ mensaje: "Disciplina no encontrada" });
    }

    res.json({ mensaje: "Disciplina eliminada" });
});

app.get("/classes", async (req, res) => {
    const { professorId, disciplineId } = req.query;

    let query = supabase.from("classes").select("*");

    if (professorId) {
        query = query.eq("professor_id", professorId);
    }
    if (disciplineId) {
        query = query.eq("discipline_id", disciplineId);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ mensaje: "Error al obtener clases", error: error.message });
    }

    res.json(data);
});

app.get("/classes/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return res.status(404).json({ mensaje: "Clase no encontrada" });
    }

    res.json(data);
});

app.post("/classes", async (req, res) => {
    const { discipline_id, professor_id, day_of_week, start_time, duration_minutes, capacity } = req.body;

    const respuestaUsuario = await fetch(`${process.env.USERS_SERVICE_URL}/users/${professor_id}`);

    if (!respuestaUsuario.ok) {
        return res.status(400).json({ mensaje: "El profesor indicado no existe" });
    }

    const usuario = await respuestaUsuario.json();

    if (usuario.role !== "PROFESOR") {
        return res.status(400).json({ mensaje: "El usuario indicado no tiene rol de profesor" });
    }

    const { data, error } = await supabase
        .from("classes")
        .insert({ discipline_id, professor_id, day_of_week, start_time, duration_minutes, capacity })
        .select()
        .single();

    if (error) {
        return res.status(400).json({ mensaje: "Error al crear clase", error: error.message });
    }

    res.status(201).json(data);
});

app.put("/classes/:id", async (req, res) => {
    const { id } = req.params;
    const { discipline_id, professor_id, day_of_week, start_time, duration_minutes, capacity } = req.body;

    if (professor_id) {
        const respuestaUsuario = await fetch(`${process.env.USERS_SERVICE_URL}/users/${professor_id}`);

        if (!respuestaUsuario.ok) {
            return res.status(400).json({ mensaje: "El profesor indicado no existe" });
        }

        const usuario = await respuestaUsuario.json();

        if (usuario.role !== "PROFESOR") {
            return res.status(400).json({ mensaje: "El usuario indicado no tiene rol de profesor" });
        }
    }

    const camposActualizados = {};
    if (discipline_id) camposActualizados.discipline_id = discipline_id;
    if (professor_id) camposActualizados.professor_id = professor_id;
    if (day_of_week) camposActualizados.day_of_week = day_of_week;
    if (start_time) camposActualizados.start_time = start_time;
    if (duration_minutes) camposActualizados.duration_minutes = duration_minutes;
    if (capacity) camposActualizados.capacity = capacity;

    const { data, error } = await supabase
        .from("classes")
        .update(camposActualizados)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return res.status(404).json({ mensaje: "Clase no encontrada" });
    }

    res.json(data);
});

app.delete("/classes/:id", async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

    if (error) {
        return res.status(404).json({ mensaje: "Clase no encontrada" });
    }

    res.json({ mensaje: "Clase eliminada" });
});


app.listen(PORT, () => {
    console.log(`Classes Service ejecutándose en http://localhost:${PORT}`);
});