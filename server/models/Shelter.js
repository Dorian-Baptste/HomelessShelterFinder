// server/models/Shelter.js
// Defines the Mongoose schema and model for shelters

const mongoose = require("mongoose");

const ShelterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Shelter name is required."],
    trim: true,
  },
  address: {
    type: String,
    required: [true, "Address is required."],
    trim: true,
  },
  location: {
    // For geospatial queries
    type: {
      type: String,
      enum: ["Point"], // 'location.type' must be 'Point'
    },
    coordinates: {
      type: [Number], // Array of numbers for [longitude, latitude]
      index: "2dsphere", // Create a geospatial index
    },
    formattedAddress: String, // Store the address returned by geocoder
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  services: {
    type: [String], // Array of strings, e.g., ["Food", "Medical", "Beds"]
    default: [],
  },
  capacity: {
    type: Number,
    min: 0,
  },
  operatingHours: {
    type: String,
    trim: true,
  },
  eligibility: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `lastUpdated` field before saving or updating
ShelterSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

ShelterSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: Date.now() });
  next();
});

module.exports = mongoose.model("Shelter", ShelterSchema);
