// server/controllers/shelterController.js
// Contains the logic for handling requests related to shelters

const Shelter = require("../models/Shelter");
const axios = require("axios"); // For making HTTP requests to Geocoding API

// Helper function for Geocoding (example using Google Geocoding API)
async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (
    !apiKey ||
    apiKey === "YOUR_GOOGLE_MAPS_API_KEY" ||
    apiKey === "TEMP_KEY_FOR_TESTING"
  ) {
    console.warn(
      "Google Maps API Key is missing, not configured, or is a placeholder. Geocoding will be skipped."
    );
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location; // lat, lng
      const formattedAddress = data.results[0].formatted_address;
      return {
        type: "Point",
        coordinates: [location.lng, location.lat], // MongoDB expects [longitude, latitude]
        formattedAddress: formattedAddress,
      };
    } else {
      console.warn(
        `Geocoding failed for address "${address}": ${data.status}`,
        data.error_message || ""
      );
      return null;
    }
  } catch (error) {
    console.error("Error during geocoding request:", error.message);
    return null;
  }
}

// Get all shelters
exports.getAllShelters = async (req, res) => {
  try {
    let query = {};
    const { search, services, near, radius } = req.query;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    if (services) {
      const servicesArray = services
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      if (servicesArray.length > 0) {
        query.services = { $all: servicesArray };
      }
    }

    if (near) {
      const [lngStr, latStr] = near.split(",").map((s) => s.trim());
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      const maxDistance = parseInt(radius, 10) || 10000; // Default 10km in meters

      if (!isNaN(lng) && !isNaN(lat)) {
        query.location = {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: maxDistance,
          },
        };
      } else {
        console.warn("Invalid coordinates for 'near' query:", near);
      }
    }

    const shelters = await Shelter.find(query).sort({ name: 1 }); // Sort by name
    res.json(shelters);
  } catch (err) {
    console.error("Error fetching shelters:", err.message);
    res
      .status(500)
      .json({ message: "Server Error: Could not fetch shelters." });
  }
};

// Create a new shelter
exports.createShelter = async (req, res) => {
  const {
    name,
    address,
    contactInfo,
    services,
    capacity,
    operatingHours,
    eligibility,
    notes,
  } = req.body;
  try {
    if (!name || !address) {
      return res
        .status(400)
        .json({ message: "Name and address are required fields." });
    }

    let locationData = null;
    if (address) {
      locationData = await geocodeAddress(address);
    }

    const newShelter = new Shelter({
      name,
      address,
      location: locationData,
      contactInfo,
      services: services || [],
      capacity,
      operatingHours,
      eligibility,
      notes,
    });

    const savedShelter = await newShelter.save();
    res.status(201).json(savedShelter);
  } catch (err) {
    console.error("Error creating shelter:", err.message);
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.errors });
    }
    res
      .status(500)
      .json({ message: "Server Error: Could not create shelter." });
  }
};

// Get a single shelter by ID
exports.getShelterById = async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ message: "Shelter not found." });
    }
    res.json(shelter);
  } catch (err) {
    console.error("Error fetching shelter by ID:", err.message);
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Shelter not found (invalid ID format)." });
    }
    res.status(500).json({ message: "Server Error: Could not fetch shelter." });
  }
};

// Update an existing shelter
exports.updateShelter = async (req, res) => {
  const {
    name,
    address,
    contactInfo,
    services,
    capacity,
    operatingHours,
    eligibility,
    notes,
  } = req.body;
  try {
    let shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ message: "Shelter not found." });
    }

    const updateData = { ...req.body }; // Start with all fields from body

    // If address is being updated, re-geocode
    if (address && address !== shelter.address) {
      const newLocationData = await geocodeAddress(address);
      updateData.location = newLocationData; // Will be null if geocoding fails
    } else if (address === shelter.address) {
      // If address is the same, don't nullify existing location if new geocoding is skipped
      updateData.location = shelter.location;
    }

    const updatedShelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(updatedShelter);
  } catch (err) {
    console.error("Error updating shelter:", err.message);
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.errors });
    }
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Shelter not found (invalid ID format)." });
    }
    res
      .status(500)
      .json({ message: "Server Error: Could not update shelter." });
  }
};

// Delete a shelter
exports.deleteShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findByIdAndDelete(req.params.id); // Use findByIdAndDelete
    if (!shelter) {
      // findByIdAndDelete returns the doc if found, or null
      return res.status(404).json({ message: "Shelter not found." });
    }
    res.json({ message: "Shelter removed successfully." });
  } catch (err) {
    console.error("Error deleting shelter:", err.message);
    if (err.kind === "ObjectId") {
      // Check if error is due to invalid ID format
      return res.status(400).json({ message: "Invalid shelter ID format." });
    }
    res
      .status(500)
      .json({ message: "Server Error: Could not delete shelter." });
  }
};
