# HomelessShelterFinder

**Project Status:** In Development (Initial setup and front-end structure complete, backend development in progress)

An application designed to help individuals in New York City (with potential for expansion) find information about homeless shelters and available resources. This project also allows for the addition of new shelter information to keep the database current.

## Project Goal & Essential Question

This project directly addresses the question: *How can we directly contribute to our communities or solve a persistent problem with the technological skills learned throughout the years in the AoIT website development class?*

Our goal is to provide a centralized, easy-to-use, and up-to-date platform for locating homeless shelters and understanding the services they offer, thereby assisting vulnerable populations in accessing critical support.

## Technologies

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (for DOM manipulation, API calls, and interactivity)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB with Mongoose (ODM)
* **APIs:**
    * Google Maps JavaScript API (for displaying shelter locations and potentially for geocoding addresses)
    * Custom RESTful API (built with Express) for managing shelter data.
* **Version Control:** Git & GitHub
* **Deployment (Planned):**
    * Frontend: Netlify or GitHub Pages
    * Backend & Database: Render, Heroku, or similar PaaS.

## Project Structure

```plaintext
homeless-shelter-finder/
├── client/                          # All front-end code
│   ├── index.html                   # Main landing page with map and general info
│   ├── search.html                  # Page for searching/filtering shelters
│   ├── shelters.html                # Page for adding/editing shelter information
│   ├── css/
│   │   ├── style.css                # Styles for index.html
│   │   ├── search.css               # Styles for search.html
│   │   ├── shelters.css             # Styles for shelters.html
│   │   └── common.css               # (Optional) Shared styles
│   ├── js/
│   │   ├── main.js                  # Client-side JS for index.html (map init, UI)
│   │   ├── searchApp.js             # Client-side JS for search.html (API calls, display results)
│   │   ├── shelterForm.js           # Client-side JS for shelters.html (form validation, submission)
│   │   └── map.js                   # (Optional) Dedicated Google Maps logic
│   └── img/                         # Static images, icons
│       └── (your_images_here)
│
├── server/                          # All back-end code
│   ├── config/
│   │   └── db.js                    # MongoDB connection setup
│   │   └── default.json             # (Optional) Configuration for port, secrets
│   ├── models/
│   │   └── Shelter.js               # Mongoose schema and model for Shelters
│   │   └── User.js                  # (Optional) Mongoose schema for Users (if admin/auth implemented)
│   ├── routes/
│   │   └── api/
│   │       ├── shelters.js          # API routes for shelter CRUD operations
│   │       └── users.js             # (Optional) API routes for user management
│   │       └── auth.js              # (Optional) API routes for authentication
│   ├── controllers/                 # (Recommended) Logic for handling requests from routes
│   │   ├── shelterController.js
│   │   └── userController.js
│   ├── middleware/                  # Custom middleware
│   │   └── authMiddleware.js        # (Optional) Middleware for protecting routes
│   └── server.js                    # Main server entry point (Express app setup, starts server)
│
├── .env                             # Environment variables (DB URI, API keys - NOT COMMITTED)
├── .gitignore                       # Specifies intentionally untracked files
├── package.json                     # Project metadata, dependencies, and scripts
├── package-lock.json                # Records exact versions of dependencies
└── README.md                        # This file
Data Model (MongoDB - Shelter.js)
The Shelter model will store information about each shelter. Key fields include:

name: String, Required (Name of the shelter)
address: String, Required (Full street address)
location: GeoJSON Point, Required (For geospatial queries, derived from address)
type: { type: String, enum: ['Point'], required: true }
coordinates: { type: [Number], required: true } // [longitude, latitude]
contactInfo: Object
phone: String
email: String
website: String
services: Array of Strings (e.g., ["Food", "Medical", "Counseling", "Beds", "Showers"])
capacity: Number (e.g., number of beds)
currentOccupancy: Number (Optional, if data is available)
operatingHours: String (e.g., "24/7", "9am-5pm Mon-Fri")
eligibility: String (e.g., "Men only", "Women and children", "All welcome")
notes: String (Additional information)
dateAdded: Date, Default: Date.now
lastUpdated: Date, Default: Date.now
Key Features
Interactive Map View: Display shelters on a Google Map using markers. Clicking a marker shows brief info and a link to details.
Comprehensive Search & Filtering:
Search by current location (geolocation).
Search by address/zip code.
Filter by services offered (e.g., food, medical, beds).
Filter by eligibility criteria.
Detailed Shelter Information Pages: Each shelter has a dedicated page with all relevant details.
Add/Edit Shelter Information: A form (shelters.html) for authorized users (initially, this might be a simple, unprotected form for project demonstration, later secured) to submit new shelters or suggest edits.
Responsive Design: The application will be mobile-friendly and accessible on various devices.
Data Persistence: Shelter data stored in MongoDB and retrieved via the backend API.
API Endpoints (Planned - server/routes/api/shelters.js)
GET /api/shelters: Retrieve a list of all shelters.
Supports query parameters for filtering (e.g., ?services=food,medical, ?near=latitude,longitude&radius=5km).
GET /api/shelters/:id: Retrieve details for a specific shelter by its ID.
POST /api/shelters: Add a new shelter to the database. (Later: protected route)
PUT /api/shelters/:id: Update an existing shelter's information. (Later: protected route)
DELETE /api/shelters/:id: Remove a shelter from the database. (Later: protected route)
Setup and Installation
Clone the repository:
Bash

git clone <your-repo-url>
cd homeless-shelter-finder
Install server-side dependencies:
Bash

npm install
Create a .env file in the project root directory. Copy the contents of .env.example (if provided) or add the following variables:
Code snippet

MONGO_URI=your_mongodb_connection_string_here
PORT=5000 # Or any port you prefer for the backend server
GOOGLE_MAPS_API_KEY=your_google_maps_javascript_api_key_here
# JWT_SECRET=a_strong_secret_for_jwt (if implementing user authentication)
Replace placeholder values with your actual credentials.

# test data for DB:
db.shelters.insertOne({
  name: "Test Shelter NYC",
  address: "123 Main St, New York, NY 10001", // Use a real address for geocoding to work later
  location: { // You might need to get these coords manually or let your app's geocoder fill them
    type: "Point",
    coordinates: [-73.985130, 40.748817] // Example: Near Empire State Building [lng, lat]
  },
  contactInfo: {
    phone: "212-555-1234",
    email: "info@testshelter.org",
    website: "http://testshelter.org"
  },
  services: ["Beds", "Meals", "Family Services", "Emergency Shelter"],
  capacity: 50,
  operatingHours: "24/7",
  eligibility: "All welcome",
  notes: "This is a test shelter entry."
});


Start the backend server:
Bash

npm run dev   # If you have a dev script in package.json (e.g., using nodemon)
# OR
npm start     # For a production start, or if 'start' is your main run script
Access the application:
The backend API will be available at http://localhost:PORT (e.g., http://localhost:5000).
To view the frontend, open client/index.html directly in your browser (for static viewing) or configure your Express server to serve these static files.
Development Progress & To-Do
[x] Initial project structure setup.
[x] Basic HTML and CSS for client pages (index.html, search.html, shelters.html).
[ ] Setup MongoDB connection (server/config/db.js).
[ ] Define Mongoose Shelter model (server/models/Shelter.js).
[ ] Implement backend API routes for shelters (CRUD operations in server/routes/api/shelters.js and server/controllers/shelterController.js).
[ ] Implement client-side JavaScript for index.html (Google Maps integration, display shelters).
[ ] Implement client-side JavaScript for search.html (fetch and display search results, filtering).
[ ] Implement client-side JavaScript for shelters.html (form validation and POST request to API).
[ ] Implement Local/Session Storage or IndexedDB for a specific feature (e.g., recently viewed shelters, saved search preferences).
[ ] Ensure mobile responsiveness across all pages.
[ ] Add error handling and user feedback mechanisms.
[ ] (Optional Stretch) User authentication for adding/editing shelters.
[ ] Write comprehensive tests (unit, integration).
[ ] Prepare written overview and presentation materials.
[ ] Deploy application.
Capstone Project Requirements Checklist
[ ] Planning:
[ ] Approved Topic
[ ] Weekly Journal
[ ] Wireframes
[ ] Checkpoint Meetings
[ ] Written Overview
[ ] Presentation Scheduled
[ ] Professional Presentation Appearance
[ ] Coding Skills:
[ ] HTML & CSS Skills
[ ] Styling/User Interface (Clean, Easy Navigation)
[ ] Mobile-Friendly
[ ] JavaScript Mastery
[ ] Local/Session Storage or IndexedDB
[ ] Forms (Input & Manipulation)
[ ] External API / Custom JSON Data (Google Maps API & Own Backend API)
[ ] Other Requirements:
[ ] GitHub Repository with Commit History
[ ] Site Hosting (Link Provided)
(This README will be updated as the project progresses.)

 npm install bcryptjs jsonwebtoken