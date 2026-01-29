const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Mongodb verbinden
mongoose.connect("mongodb://localhost:27017/mongo-app")
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

// In-Memory-Daten
let topics = [];
let nextTopicId = 1;

// User Schema
const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    password: String,
    course: String,
});

const User = mongoose.model("User", userSchema);

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

app.post('/api/registration', async (req, res) => {
    try {
        const { firstname, lastname, username, password, course } = req.body;

        const user = new User({
            firstname,
            lastname,
            username,
            password,
            course
        });

        await user.save();

        res.status(201).json({
            message: 'Registrierung erfolgreich',
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                course: user.course
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Fehler bei der Registrierung' });
    }
});

// API: Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username, password });

        if (!user) {
            return res.status(401).json({ message: 'Falsche Anmeldedaten' });
        }

        res.json({
            message: 'Login erfolgreich',
            user: {
                id: user._id,
                username: user.username,
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Login' });
    }
});

// Server starten
app.listen(3001, () => {
    console.log("Server läuft auf http://localhost:3001");
});
