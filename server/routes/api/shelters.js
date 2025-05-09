// server/routes/api/shelters.js
// Defines API routes for shelter-related operations

const express = require("express");
const router = express.Router();
// Import controller functions
const shelterController = require("../../controllers/shelterController");

// @route   GET /api/shelters
// @desc    Get all shelters (can include query params for filtering/searching)
// @access  Public
router.get("/", shelterController.getAllShelters);

// @route   POST /api/shelters
// @desc    Add a new shelter
// @access  Public (for now, ideally private/admin later)
router.post("/", shelterController.createShelter);

// @route   GET /api/shelters/:id
// @desc    Get a single shelter by its ID
// @access  Public
router.get("/:id", shelterController.getShelterById);

// @route   PUT /api/shelters/:id
// @desc    Update an existing shelter by its ID
// @access  Public (for now, ideally private/admin later)
router.put("/:id", shelterController.updateShelter);

// @route   DELETE /api/shelters/:id
// @desc    Delete a shelter by its ID
// @access  Public (for now, ideally private/admin later)
router.delete("/:id", shelterController.deleteShelter);

module.exports = router;
