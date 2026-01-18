const express = require("express");
const app = express();

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(3001, () => {
    console.log("Server läuft auf http://localhost:3001");
});

app.use(express.static("public"));