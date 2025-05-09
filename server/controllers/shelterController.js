// server/controllers/shelterController.js
// Contains the logic for handling requests related to shelters

const Shelter = require("../models/Shelter");
const axios = require("axios"); // For making HTTP requests to Geocoding API

// Helper function for Geocoding (example using Google Geocoding API)
async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("Google Maps API Key not found. Geocoding will be skipped.");
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
    console.error("Error during geocoding:", error.message);
    return null;
  }
}

// Controller methods

// Get all shelters
// GET /api/shelters
exports.getAllShelters = async (req, res) => {
  try {
    // Basic query object
    let query = {};
    const { search, services, near } = req.query;

    // Text search (simple case-insensitive search on name and address)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by services (if services is a comma-separated string)
    if (services) {
      const servicesArray = services.split(",").map((s) => s.trim());
      if (servicesArray.length > 0) {
        query.services = { $all: servicesArray }; // Must have all specified services
      }
    }

    // Geospatial query: find shelters near a point
    // ?near=longitude,latitude&radius=5000 (radius in meters)
    if (near) {
      const [lng, lat] = near.split(",").map(parseFloat);
      const radius = parseInt(req.query.radius, 10) || 10000; // Default 10km

      if (!isNaN(lng) && !isNaN(lat)) {
        query.location = {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: radius, // in meters
          },
        };
      }
    }

    const shelters = await Shelter.find(query).sort({ dateAdded: -1 }); // Sort by newest first
    res.json(shelters);
  } catch (err) {
    console.error("Error fetching shelters:", err.message);
    res
      .status(500)
      .json({ message: "Server Error: Could not fetch shelters." });
  }
};

// Create a new shelter
// POST /api/shelters
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
    // Basic validation
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
      location: locationData, // This will be null if geocoding fails or address is not provided
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
// GET /api/shelters/:id
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
// PUT /api/shelters/:id
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

    // Prepare update data
    const updateData = {
      name: name || shelter.name,
      address: address || shelter.address,
      contactInfo: contactInfo || shelter.contactInfo,
      services: services || shelter.services,
      capacity: capacity !== undefined ? capacity : shelter.capacity,
      operatingHours: operatingHours || shelter.operatingHours,
      eligibility: eligibility || shelter.eligibility,
      notes: notes || shelter.notes,
      lastUpdated: Date.now(), // Explicitly set lastUpdated
    };

    // If address is being updated, re-geocode
    if (address && address !== shelter.address) {
      const newLocationData = await geocodeAddress(address);
      if (newLocationData) {
        updateData.location = newLocationData;
      } else {
        // Handle case where new address can't be geocoded - maybe keep old location or nullify
        console.warn(
          `Could not geocode new address "${address}" for shelter ID ${shelter._id}. Location not updated.`
        );
      }
    }

    const updatedShelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true } // Return the modified document and run schema validators
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
// DELETE /api/shelters/:id
exports.deleteShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ message: "Shelter not found." });
    }

    await Shelter.findByIdAndDelete(req.params.id); // Use findByIdAndDelete

    res.json({ message: "Shelter removed successfully." });
  } catch (err) {
    console.error("Error deleting shelter:", err.message);
    if (err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Shelter not found (invalid ID format)." });
    }
    res
      .status(500)
      .json({ message: "Server Error: Could not delete shelter." });
  }
};
