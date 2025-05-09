// server/server.js
// Main entry point for the HomelessShelterFinder backend server

const path = require("path"); // Import the 'path' module at the top

// Load environment variables from .env file located in the project root
// Use path.resolve to create an absolute path to the .env file
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
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
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

// Catch-all handler for any requests that don't match API routes or static files.
// This sends the main index.html file, allowing client-side routing (if used) to take over.
app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api") || req.originalUrl.includes(".")) {
    return; // Let Express handle 404 for API or files not found by static middleware
  }
  res.sendFile(path.resolve(clientPath, "index.html"));
});

// --- Define Port and Start Server ---
const PORT = process.env.PORT || 5001; // Use port from .env or default

app.listen(PORT, () => {
  console.log(
    `HomelessShelterFinder server running on http://localhost:${PORT}`
  );
});
