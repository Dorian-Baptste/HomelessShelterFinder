// client/js/main.js
// Handles main page logic, primarily Google Maps initialization and display.

let map; // Google Map object
let infoWindow; // InfoWindow for map markers
const NYC_COORDS = { lat: 40.7128, lng: -74.006 }; // Default to NYC

// Function to initialize the Google Map
async function initMap() {
  const mapElement = document.getElementById("map"); // Get the map div from index.html
  if (!mapElement) {
    console.error("Map element not found in HTML.");
    return;
  }

  try {
    // Dynamically load the Google Maps API if not already loaded
    // This ensures GOOGLE_MAPS_API_KEY is available from the script tag in index.html
    // No, this is not how it works. The script tag in HTML loads the API.
    // This function is the callback specified in that script tag.

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new Map(mapElement, {
      center: NYC_COORDS,
      zoom: 11, // Adjust zoom level as needed
      mapId: "HOMELESS_SHELTER_MAP", // Optional: for cloud-based map styling
    });

    infoWindow = new google.maps.InfoWindow();

    // Fetch all shelters and display them on the map
    fetchAndDisplayShelters();

    // Attempt to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(userLocation);
          map.setZoom(13); // Zoom in closer to user's location
          // Optionally, add a marker for the user's location
          new AdvancedMarkerElement({
            map: map,
            position: userLocation,
            title: "Your Location",
            // Customize user marker if needed
          });
        },
        () => {
          console.warn(
            "User denied geolocation or error occurred. Defaulting to NYC."
          );
          // handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      console.warn("Browser does not support geolocation. Defaulting to NYC.");
      // handleLocationError(false, infoWindow, map.getCenter());
    }
  } catch (error) {
    console.error("Error initializing Google Map:", error);
    mapElement.innerHTML =
      '<p style="color: red; text-align: center;">Could not load the map. Please check your API key and internet connection.</p>';
  }
}

// Function to fetch shelters from the backend API
async function fetchAndDisplayShelters() {
  try {
    const response = await fetch("/api/shelters"); // Adjust if your API prefix is different
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const shelters = await response.json();
    displaySheltersOnMap(shelters);
  } catch (error) {
    console.error("Error fetching shelters:", error);
    // Optionally display an error message to the user on the page
  }
}

// Function to display shelter markers on the map
function displaySheltersOnMap(shelters) {
  if (!map) {
    console.error("Map object is not initialized.");
    return;
  }

  shelters.forEach((shelter) => {
    if (shelter.location && shelter.location.coordinates) {
      const [lng, lat] = shelter.location.coordinates;
      const position = { lat, lng };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: position,
        title: shelter.name,
        // You can customize marker icons here
      });

      // Create content for the InfoWindow
      const contentString = `
        <div class="infowindow-content">
          <h3>${shelter.name}</h3>
          <p><strong>Address:</strong> ${shelter.address}</p>
          ${
            shelter.contactInfo && shelter.contactInfo.phone
              ? `<p><strong>Phone:</strong> ${shelter.contactInfo.phone}</p>`
              : ""
          }
          ${
            shelter.services && shelter.services.length > 0
              ? `<p><strong>Services:</strong> ${shelter.services.join(
                  ", "
                )}</p>`
              : ""
          }
          <a href="/search.html?id=${
            shelter._id
          }" target="_blank">More Details</a>
        </div>
      `; // Link to a search/detail page

      marker.addListener("click", () => {
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
      });
    } else {
      console.warn(
        `Shelter "${shelter.name}" (ID: ${shelter._id}) is missing location data and cannot be mapped.`
      );
    }
  });
}

// Placeholder for handling location errors (optional)
// function handleLocationError(browserHasGeolocation, infoWindow, pos) {
//   infoWindow.setPosition(pos);
//   infoWindow.setContent(
//     browserHasGeolocation
//       ? "Error: The Geolocation service failed."
//       : "Error: Your browser doesn't support geolocation."
//   );
//   infoWindow.open(map);
// }

// Event listener for the search input on the main page (if you have one)
const mainSearchInput = document.querySelector(
  '.search-container input[type="text"]'
);
const mainSearchButton = document.querySelector(
  ".search-container button.search-button"
);

if (mainSearchInput && mainSearchButton) {
  mainSearchButton.addEventListener("click", () => {
    const searchTerm = mainSearchInput.value.trim();
    if (searchTerm) {
      // Redirect to search page with the search term
      window.location.href = `/search.html?q=${encodeURIComponent(searchTerm)}`;
    }
  });

  mainSearchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      mainSearchButton.click();
    }
  });
}

// Expose initMap to the global scope if it's called by Google Maps API callback
// This is typically done by adding `&callback=initMap` to the Google Maps script URL in index.html
// window.initMap = initMap; // This is not needed if script tag has callback=initMap
// and initMap is a global function.
// If using modules, you might need to explicitly attach.
// For simplicity, assuming initMap is global due to script tag.

// Note: The Google Maps script in index.html should look like:
// <script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap&libraries=marker"></script>
// The `&libraries=marker` is important for `AdvancedMarkerElement`.
