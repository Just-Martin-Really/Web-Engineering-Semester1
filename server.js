const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorMiddleware");

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.send('OK');
});

// Mongodb verbinden
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mongo-app";
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Connected to", mongoURI))
    .catch((err) => console.log("MongoDB Connection Error:", err));

// Routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));

// Error Handler Middleware
app.use(errorHandler);

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