// server/routes/api/auth.js
const express = require("express");
const router = express.Router();
const User = require("../../models/User"); // User model
const jwt = require("jsonwebtoken");
const { protect } = require("../../middleware/authMiddleware"); // Middleware to protect routes

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (Login)
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (user not found)" });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (password incorrect)" });
    }

    // User matched, create JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" }, // Token expires in 5 hours
      (err, token) => {
        if (err) throw err;
        res.json({
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
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

// @route   GET /api/auth/user
// @desc    Get logged-in user's data (example protected route)
// @access  Private (requires token)
router.get("/user", protect, async (req, res) => {
  try {
    // req.user is set by the 'protect' middleware
    // Fetch user again to ensure latest data, or just use req.user if it has all needed fields
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching authenticated user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
