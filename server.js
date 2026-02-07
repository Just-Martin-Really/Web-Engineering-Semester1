const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// More explicit CORS configuration
app.use(cors({
    origin: true, // Reflects the request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Health check endpoint - FIRST, before other routes
app.get('/health', (req, res) => {
    res.send('OK');
});

// Mongodb verbinden
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mongo-app";
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Connected to", mongoURI))
    .catch((err) => console.log("MongoDB Connection Error:", err));


// User Schema
const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    password: String,
    course: String,
});

const User = mongoose.model("User", userSchema);

// Topic Schema
const topicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Topic = mongoose.model("Topic", topicSchema);

// Topics abrufen
app.get("/api/topics", async (req, res) => {
    try {
        const topics = await Topic.find().sort({ createdAt: -1 });
        res.json(topics);
    } catch (error) {
        res.status(500).json({ message: "Fehler beim Abrufen der Themen" });
    }
});

// Topic erstellen
app.post("/api/topics", async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                error: "Titel und Inhalt sind Pflichtfelder"
            });
        }

        const topic = new Topic({
            title,
            content
        });

        await topic.save();
        res.status(201).json(topic);
    } catch (error) {
        res.status(500).json({ message: "Fehler beim Erstellen des Themas" });
    }
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
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Fehler bei der Registrierung',
            error: error.message
        });
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
const PORT = 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server läuft auf http://0.0.0.0:${PORT}`);
    console.log(`🕒 Started at: ${new Date().toISOString()}`);
});

// Add error handling
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
});