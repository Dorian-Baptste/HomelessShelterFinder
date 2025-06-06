// client/js/main.js
// Handles ALL main page logic: Google Maps, Shelter List, Search, and Bookmarks.

// --- Global variables ---
let map;
let infoWindow;
const NYC_COORDS = { lat: 40.7128, lng: -74.006 };
let allShelters = []; // To store the master list of shelter data
let currentMarkers = []; // To keep track of markers on the map
let userBookmarks = new Set(); // To store user's bookmarked shelter IDs

// --- DOM Element References ---
const mainSearchInput = document.getElementById("mainSearchInput");
const mainSearchButton = document.getElementById("mainSearchButton");
const resultsContainer = document.getElementById("resultsContainer");

// =================================================================
// INITIALIZATION
// =================================================================

// Function to initialize the Google Map (called by Google Maps API script)
async function initMap() {
  // --- Map Initialization ---
  const mapElement = document.getElementById("map");
  mapElement.innerHTML = ""; // Clear "Loading map..." text

  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  map = new Map(mapElement, {
    center: NYC_COORDS,
    zoom: 11,
    mapId: "HOMELESS_SHELTER_MAP_DASHBOARD_V2",
  });

  infoWindow = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, -10),
  });

  // --- Data Fetching and Display ---
  await fetchUserBookmarks(); // Get bookmark info first
  await fetchAndDisplayAllShelters(); // Fetch all shelter data

  // --- Geolocation ---
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.setCenter(userLocation);
        map.setZoom(13);

        const userMarker = new AdvancedMarkerElement({
          map,
          position: userLocation,
          title: "Your Location",
        });

        // --- NEW: Add click listener for the user's location marker ---
        userMarker.addListener("click", () => {
          infoWindow.setContent("<h3>Current Location</h3>");
          infoWindow.open(map, userMarker);
        });
      },
      () => console.warn("Geolocation failed. Defaulting to NYC.")
    );
  }
}

// =================================================================
// DATA FETCHING & DISPLAY
// =================================================================

// Fetches all shelters from the API and triggers the initial display
async function fetchAndDisplayAllShelters() {
  resultsContainer.innerHTML = "<p>Loading shelters...</p>";
  try {
    const response = await fetch("/api/shelters");
    if (!response.ok) throw new Error(`API error! Status: ${response.status}`);

    const shelters = await response.json();
    allShelters = shelters; // Store in our global variable

    displaySheltersOnMap(allShelters);
    displaySheltersInList(allShelters);
  } catch (error) {
    console.error("Error fetching shelter data:", error);
    resultsContainer.innerHTML =
      '<p style="color: red;">Could not load shelter data.</p>';
  }
}

// Displays a list of shelters in the right-hand panel
function displaySheltersInList(sheltersToDisplay) {
  resultsContainer.innerHTML = "";

  if (sheltersToDisplay.length === 0) {
    resultsContainer.innerHTML =
      "<p>No shelters found matching your criteria.</p>";
    return;
  }

  const loggedIn = isLoggedIn();

  sheltersToDisplay.forEach((shelter) => {
    const shelterDiv = document.createElement("div");
    shelterDiv.className = "result-item";

    const phone = shelter.contactInfo?.phone || "N/A";
    const services = shelter.services?.join(", ") || "N/A";

    let bookmarkButtonHTML = "";
    if (loggedIn) {
      const isBookmarked = userBookmarks.has(shelter._id);
      bookmarkButtonHTML = `
                <button class="bookmark-btn ${
                  isBookmarked ? "bookmarked" : ""
                }" data-shelter-id="${shelter._id}">
                    ${isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                </button>
            `;
    }

    shelterDiv.innerHTML = `
            <h3 class="result-title">${shelter.name}</h3>
            <p><strong>Address:</strong> ${shelter.address || "N/A"}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Services:</strong> ${services}</p>
            <p><strong>Eligibility:</strong> ${shelter.eligibility || "N/A"}</p>
            <p><strong>Hours:</strong> ${shelter.operatingHours || "N/A"}</p>
            ${
              shelter.notes
                ? `<p><strong>Notes:</strong> ${shelter.notes}</p>`
                : ""
            }
            ${bookmarkButtonHTML}
        `;
    resultsContainer.appendChild(shelterDiv);
  });
}

// Displays shelter markers on the Google Map
async function displaySheltersOnMap(sheltersToDisplay) {
  clearMarkers();
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  sheltersToDisplay.forEach((shelter) => {
    if (shelter.location?.coordinates) {
      const [lng, lat] = shelter.location.coordinates;
      if (typeof lat !== "number" || typeof lng !== "number") return;

      const marker = new AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: shelter.name,
      });
      currentMarkers.push(marker);

      const phone = shelter.contactInfo?.phone || "N/A";
      let shelterTypeInfo = "General Services";
      if (shelter.services && shelter.services.length > 0) {
        const servicesLower = shelter.services.map((s) => s.toLowerCase());
        if (servicesLower.some((s) => s.includes("family")))
          shelterTypeInfo = "Family Resources";
        else if (servicesLower.some((s) => s.includes("youth")))
          shelterTypeInfo = "Youth Services";
        else if (servicesLower.some((s) => s.includes("women")))
          shelterTypeInfo = "Women's Shelter";
        else if (servicesLower.some((s) => s.includes("men")))
          shelterTypeInfo = "Men's Shelter";
        else shelterTypeInfo = shelter.services.slice(0, 2).join(", ");
      }

      const contentString = `
        <div class="infowindow-content">
          <h3>${shelter.name || "Unnamed Shelter"}</h3>
          <p><strong>Type:</strong> ${shelterTypeInfo}</p>
          <p><strong>Address:</strong> ${shelter.address || "N/A"}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><a href="${
            shelter.contactInfo?.website || "#"
          }" target="_blank" rel="noopener noreferrer">More Details</a></p>
        </div>
      `;

      marker.addListener("click", () => {
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
      });
    }
  });
}

// =================================================================
// USER ACTIONS (SEARCH & BOOKMARKS)
// =================================================================

// Filter shelters based on search input and update both map and list
function handleSearch() {
  const searchTerm = mainSearchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    displaySheltersOnMap(allShelters);
    displaySheltersInList(allShelters);
    return;
  }

  const filteredShelters = allShelters.filter(
    (shelter) =>
      (shelter.name && shelter.name.toLowerCase().includes(searchTerm)) ||
      (shelter.address && shelter.address.toLowerCase().includes(searchTerm)) ||
      (shelter.notes && shelter.notes.toLowerCase().includes(searchTerm))
  );

  displaySheltersOnMap(filteredShelters);
  displaySheltersInList(filteredShelters);
}

// Fetches the current user's bookmarks to update UI state
async function fetchUserBookmarks() {
  if (!isLoggedIn()) return;
  try {
    const token = getToken();
    const response = await fetch("/api/users/bookmarks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const bookmarks = await response.json();
      userBookmarks = new Set(bookmarks.map((b) => b._id));
    }
  } catch (error) {
    console.error("Could not fetch user bookmarks:", error);
  }
}

// --- Event Listeners ---
if (mainSearchButton && mainSearchInput) {
  mainSearchButton.addEventListener("click", handleSearch);
  mainSearchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") handleSearch();
  });
}

resultsContainer.addEventListener("click", async (event) => {
  if (event.target.classList.contains("bookmark-btn")) {
    const button = event.target;
    const shelterId = button.dataset.shelterId;
    const token = getToken();
    if (!token) return;

    const isBookmarked = button.classList.contains("bookmarked");
    const method = isBookmarked ? "DELETE" : "POST";
    const url = `/api/users/bookmarks/${shelterId}`;

    try {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        button.classList.toggle("bookmarked");
        if (isBookmarked) {
          button.innerHTML = "☆ Bookmark";
          userBookmarks.delete(shelterId);
        } else {
          button.innerHTML = "★ Bookmarked";
          userBookmarks.add(shelterId);
        }
      } else {
        alert(`Error: ${(await response.json()).message}`);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
      alert("An error occurred.");
    }
  }
});

// Helper function to clear map markers
function clearMarkers() {
  currentMarkers.forEach((marker) => (marker.map = null));
  currentMarkers = [];
}
