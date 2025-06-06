// server/server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const connectDB = require("./config/db");

// --- NEW IMPORTS ---
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Create an HTTP server from the Express app
const io = new Server(server); // Attach Socket.IO to the HTTP server

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- NEW MIDDLEWARE: Make 'io' accessible to our routes ---
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- API Routes ---
app.use("/api/shelters", require("./routes/api/shelters"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));

// --- Serve Static Assets (Frontend Files) ---
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
  // This logic is simplified to serve index.html for any non-API, non-file route
  if (!req.originalUrl.startsWith("/api") && !req.originalUrl.includes(".")) {
    res.sendFile(path.resolve(clientPath, "index.html"));
  }
});

// --- NEW: Socket.IO connection handler ---
io.on("connection", (socket) => {
  console.log("A user connected via Socket.IO");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5001;
// --- MODIFIED: Use the 'server' to listen, not the 'app' ---
server.listen(PORT, () => {
  console.log(
    `HomelessShelterFinder server running on http://localhost:${PORT}`
  );
});
