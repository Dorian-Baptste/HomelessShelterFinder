// server/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI_from_env = process.env.MONGO_URI; // Get it from process.env

    // ---- TEMPORARY DEBUG LINE ----
    // console.log(
    //   "DEBUG: Attempting to connect with MONGO_URI =",
    //   mongoURI_from_env
    // );
    // ---- END TEMPORARY DEBUG LINE ----

    if (!mongoURI_from_env) {
      console.error(
        "MongoDB Connection Error: MONGO_URI is UNDEFINED. Check .env file and its loading."
      );
      process.exit(1);
    }

    await mongoose.connect(mongoURI_from_env);
    console.log(
      "MongoDB Connected Successfully to HomelessShelterFinder database!"
    );
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
