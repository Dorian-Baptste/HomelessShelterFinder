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
  // GeoJSON Point for geospatial queries
  location: {
    type: {
      type: String,
      enum: ["Point"], // 'location.type' must be 'Point'
      // required: true // Make it optional initially if geocoding is separate
    },
    coordinates: {
      type: [Number], // Array of numbers for [longitude, latitude]
      // required: true,
      index: "2dsphere", // Create a geospatial index for location queries
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
      // Basic email validation
      // match: [/.+\@.+\..+/, 'Please fill a valid email address']
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
    // e.g., "Men only", "Women and children", "All welcome"
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
  // (Optional) If you implement user accounts for who added/manages the shelter
  // addedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User' // Reference to a User model
  // }
});

// Middleware to update `lastUpdated` field before saving
ShelterSchema.pre("save", function (next) {
  if (this.isModified()) {
    // only update if something has changed
    this.lastUpdated = Date.now();
  }
  next();
});

module.exports = mongoose.model("Shelter", ShelterSchema);
