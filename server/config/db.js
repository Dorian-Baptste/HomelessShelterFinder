// server/config/db.js
// Handles MongoDB database connection for the HomelessShelterFinder project

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI_from_env = process.env.MONGO_URI;

    if (!mongoURI_from_env) {
      console.error(
        "MongoDB Connection Error: MONGO_URI is UNDEFINED. Check .env file and its loading."
      );
      process.exit(1); // Exit if URI is missing
    }

    await mongoose.connect(mongoURI_from_env);
    console.log(
      "MongoDB Connected Successfully to HomelessShelterFinder database!"
    );
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
