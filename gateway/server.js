const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    res.json({ mensaje: "Gateway funcionando" });
});

app.use("/auth", createProxyMiddleware({
    target: process.env.USERS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => "/auth" + path,
}));

app.use("/users", createProxyMiddleware({
    target: process.env.USERS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => "/users" + path,
}));

app.use("/disciplines", createProxyMiddleware({
    target: process.env.CLASSES_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => "/disciplines" + path,
}));

app.use("/classes", createProxyMiddleware({
    target: process.env.CLASSES_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => "/classes" + path,
}));

app.use("/bookings", createProxyMiddleware({
    target: process.env.BOOKING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => "/bookings" + path,
}));

const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Gateway ejecutándose en http://localhost:${PORT}`);
});