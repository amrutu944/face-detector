const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const path = require("path");

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);


// Routes
const photoRoutes = require("./routes/photoRoutes");


// Load env
require("dotenv").config({ path: "./.env", override: true });

// Create app ONLY ONCE ✅
const app = express();

const fs = require("fs");
console.log("ENV EXISTS:", fs.existsSync("./.env"));

// Init socket


const PORT = process.env.PORT || 4000;

// ===== CORS =====
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
}));

// ===== BODY =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== STATIC =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== ROUTES =====
app.use("/api", photoRoutes);


// ===== HEALTH =====
app.get("/", (req, res) => {
  res.json({ message: "Server running ✅" });
});

// ===== ERROR =====
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// ===== START SERVER =====


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});