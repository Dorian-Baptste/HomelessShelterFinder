// server/server.js
// Main entry point for the HomelessShelterFinder backend server

const path = require("path"); // Import the 'path' module at the top

// Load environment variables from .env file located in the project root
// Use path.resolve to create an absolute path to the .env file
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// ---- TEMPORARY DIRECT DEBUG LINE (Keep these for now) ----
// console.log("DEBUG in server.js: MONGO_URI =", process.env.MONGO_URI);
// console.log("DEBUG in server.js: PORT =", process.env.PORT);
// console.log(
//   "DEBUG in server.js: GOOGLE_MAPS_API_KEY =",
//   process.env.GOOGLE_MAPS_API_KEY
// );
// ---- END TEMPORARY DIRECT DEBUG LINE ----

const express = require("express");
// const path = require('path'); // Already imported above for dotenv
const connectDB = require("./config/db"); // Import database connection function

// Initialize Express application
const app = express();

// --- Connect to Database ---
// Call the function to establish MongoDB connection
connectDB();

// --- Middleware ---
// Enable Express to parse JSON request bodies
app.use(express.json());
// Enable Express to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: false }));

// --- API Routes ---
// Example: Test API route
app.get("/api/test", (req, res) => {
  res.json({ message: "Welcome to the Homeless Shelter Finder API!" });
});

// Mount the shelters API routes
app.use("/api/shelters", require("./routes/api/shelters"));

// (Optional) Mount user and authentication routes if you implement them
// app.use('/api/users', require('./routes/api/users'));
// app.use('/api/auth', require('./routes/api/auth'));

// --- Serve Static Assets (Frontend Files) ---
// This tells Express where to find your client-side HTML, CSS, and JavaScript files.
// The path should point to your 'client' directory.
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

// Catch-all handler for any requests that don't match API routes or static files.
// This sends the main index.html file, allowing client-side routing (if used) to take over.
app.get("*", (req, res) => {
  // Check if the request is for an API endpoint or a file with an extension.
  // If so, it means previous route handlers should have caught it, or it's a 404 for a static file.
  if (req.originalUrl.startsWith("/api") || req.originalUrl.includes(".")) {
    // Let it fall through to Express's default 404 handling if no routes matched.
    return;
  }
  // Otherwise, serve the main HTML page for client-side apps.
  res.sendFile(path.resolve(clientPath, "index.html"));
});

// --- Define Port and Start Server ---
// Use the port defined in .env, or default to 5001 (or another suitable port)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `HomelessShelterFinder server running on http://localhost:${PORT}`
  );
});
