// server/routes/api/users.js
const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const jwt = require("jsonwebtoken");

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Create new user instance (password will be hashed by pre-save hook in User model)
    user = new User({
      name,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id, // Mongoose uses 'id' as a virtual getter for '_id'
      },
    };

    // Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" }, // Token expires in 5 hours (adjust as needed)
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: {
            // Send back some user info (excluding password)
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      }
    );
  } catch (error) {
    console.error("User registration error:", error.message);
    if (error.name === "ValidationError") {
      // Extract validation messages
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
});

module.exports = router;
