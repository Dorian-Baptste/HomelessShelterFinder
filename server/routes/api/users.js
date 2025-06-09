// server/routes/api/users.js
const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Shelter = require("../../models/Shelter");
const jwt = require("jsonwebtoken");
const { protect } = require("../../middleware/authMiddleware");

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
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

    user = new User({
      name,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: {
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
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Bookmark routes...
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
    req.io.emit("shelter_bookmarked", { shelterName: shelter.name });
    res.status(200).json({ message: "Shelter bookmarked successfully" });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ message: "Server error while adding bookmark" });
  }
});
router.delete("/bookmarks/:shelterId", protect, async (req, res) => {
  try {
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

// @route   GET /api/users/all
// @desc    Get all users (for display on users page)
// @access  Private
router.get("/all", protect, async (req, res) => {
  try {
    // Find all users and select only their name and email for security
    const users = await User.find({}).select("name email");
    res.json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
