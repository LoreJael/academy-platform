const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const supabase = require("./supabaseClient");

const app = express();
app.use(express.json());   

const PORT = 3000;


app.get("/", (req, res) => {
    res.json({
        mensaje: "Users Service funcionando"
    });
});

app.get("/users", async (req, res) => {
    const { role } = req.query;

    let query = supabase.from("profiles").select("*");

    if (role) {
        query = query.eq("role", role);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
    }

    res.json(data);
});

app.get("/users/me", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensaje: "Falta el token de autenticación" });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
        return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }

    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

    if (profileError) {
        return res.status(404).json({ mensaje: "Perfil no encontrado" });
    }

    res.json(profileData);
});

app.get("/users/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(data);
});


app.put("/users/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, role } = req.body;

    const camposActualizados = {};
    if (nombre) camposActualizados.nombre = nombre;
    if (role) camposActualizados.role = role;

    const { data, error } = await supabase
        .from("profiles")
        .update(camposActualizados)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(data);
});

app.delete("/users/:id", async (req, res) => {
    const { id } = req.params;

    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
        
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario eliminado" });
});

app.post("/auth/register", async (req, res) => {
    const { email, password, nombre, role } = req.body;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        return res.status(400).json({ mensaje: "Error al crear usuario", error: authError.message });
    }

    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert({
            id: authData.user.id,
            nombre,
            role
        })
        .select()
        .single();

    if (profileError) {
        return res.status(500).json({ mensaje: "Error al crear perfil", error: profileError.message });
    }

    res.status(201).json(profileData);
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const authClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return res.status(401).json({ mensaje: "Credenciales inválidas", error: error.message });
    }

    res.json({
        access_token: data.session.access_token,
        user: data.user
    });
});



app.listen(PORT, () => {
    console.log(`Users Service ejecutándose en http://localhost:${PORT}`);
});