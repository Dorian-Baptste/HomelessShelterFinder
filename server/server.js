// server/server.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- API Routes ---
app.get("/api/test", (req, res) => {
  res.json({ message: "Welcome to the Homeless Shelter Finder API!" });
});

// Mount the shelters API routes
app.use("/api/shelters", require("./routes/api/shelters"));

// Mount NEW User and Auth routes
app.use("/api/users", require("./routes/api/users")); // For user registration
app.use("/api/auth", require("./routes/api/auth")); // For login & getting auth user

// --- Serve Static Assets (Frontend Files) ---
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api") || req.originalUrl.includes(".")) {
    return;
  }
  res.sendFile(path.resolve(clientPath, "index.html"));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(
    `HomelessShelterFinder server running on http://localhost:${PORT}`
  );
});
