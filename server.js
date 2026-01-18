const express = require("express");
const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// In-Memory-Daten
let topics = [];
let nextTopicId = 1;

// Test-API
app.get("/api/health", (req, res) => {
    res.json({status: "ok", message: "API läuft"});
});

// Topics abrufen
app.get("/api/topics", (req, res) => {
    res.json(topics);
});

// Topic erstellen
app.post("/api/topics", (req, res) => {
    const {title, content, anonymous} = req.body;

    if (!title || !content) {
        return res.status(400).json({
            error: "Titel und Inhalt sind Pflichtfelder"
        });
    }

    const topic = {
        id: nextTopicId++,
        title,
        content,
        anonymous: !!anonymous,
        createdAt: new Date()
    };

    topics.push(topic);
    res.status(201).json(topic);
});

// Server starten
app.listen(3001, () => {
    console.log("Server läuft auf http://localhost:3001");
});
