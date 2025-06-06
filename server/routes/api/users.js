// server/routes/api/users.js
const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Shelter = require("../../models/Shelter"); // <-- Import Shelter model
const jwt = require("jsonwebtoken");
const { protect } = require("../../middleware/authMiddleware"); // <-- Import protect middleware

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  // This registration logic remains unchanged.
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }
    user = new User({ name, email: email.toLowerCase(), password });
    await user.save();
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: { id: user.id, name: user.name, email: user.email },
        });
      }
    );
  } catch (error) {
    console.error("User registration error:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
});

// --- NEWLY ADDED AND CORRECTED BOOKMARK ROUTES ---

// @route   POST /api/users/bookmarks/:shelterId
// @desc    Add a shelter to user's bookmarks
// @access  Private
router.post("/bookmarks/:shelterId", protect, async (req, res) => {
  try {
    const shelterId = req.params.shelterId;
    const shelter = await Shelter.findById(shelterId);
    if (!shelter) {
      return res.status(404).json({ message: "Shelter not found" });
    }

    await User.updateOne(
      { _id: req.user.id },
      { $addToSet: { bookmarkedShelters: shelterId } }
    );

    // --- NEW: Emit event to all connected clients ---
    req.io.emit("shelter_bookmarked", { shelterName: shelter.name });

    res.status(200).json({ message: "Shelter bookmarked successfully" });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ message: "Server error while adding bookmark" });
  }
});

// @route   DELETE /api/users/bookmarks/:shelterId
// @desc    Remove a shelter from user's bookmarks
// @access  Private
router.delete("/bookmarks/:shelterId", protect, async (req, res) => {
  try {
    // Use $pull to remove the shelter ID from the array
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { bookmarkedShelters: req.params.shelterId } }
    );

    res.status(200).json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ message: "Server error while removing bookmark" });
  }
});

// @route   GET /api/users/bookmarks
// @desc    Get all bookmarked shelters for a user
// @access  Private
router.get("/bookmarks", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "bookmarkedShelters"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.bookmarkedShelters);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ message: "Server error while fetching bookmarks" });
  }
});

module.exports = router;
