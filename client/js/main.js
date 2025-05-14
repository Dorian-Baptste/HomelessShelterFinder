// client/js/main.js
// Handles main page logic, primarily Google Maps initialization and display.

let map; // Google Map object
let infoWindow; // InfoWindow for map markers
const NYC_COORDS = { lat: 40.7128, lng: -74.006 }; // Default to NYC

// Function to initialize the Google Map (called by Google Maps API script callback)
async function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error('Map element with id="map" not found in HTML.');
    const mapContainer = document.querySelector(".map-container");
    if (mapContainer)
      mapContainer.innerHTML =
        '<p style="color: red; text-align: center;">Error: Map container not found.</p>';
    return;
  }
  mapElement.innerHTML = ""; // Clear "Loading map..." text

  try {
    if (typeof google === "undefined" || typeof google.maps === "undefined") {
      console.error("Google Maps API not loaded.");
      mapElement.innerHTML =
        '<p style="color: red; text-align: center;">Error: Google Maps API failed to load. Check API key and script tag.</p>';
      return;
    }

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new Map(mapElement, {
      center: NYC_COORDS,
      zoom: 11,
      mapId: "HOMELESS_SHELTER_MAP_DASHBOARD", // Unique Map ID
      gestureHandling: "greedy",
    });

    infoWindow = new google.maps.InfoWindow({
      pixelOffset: new google.maps.Size(0, -10),
    });

    fetchAndDisplayShelters(); // Fetch shelters and add markers
    // adjustContentMargin(); // <<<< THIS FUNCTION AND ITS CALLS SHOULD BE REMOVED

    // Attempt to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(userLocation);
          map.setZoom(13);

          new AdvancedMarkerElement({
            map: map,
            position: userLocation,
            title: "Your Current Location",
          });
        },
        (error) => {
          console.warn(
            `Geolocation error: ${error.message}. Defaulting to NYC.`
          );
        }
      );
    } else {
      console.warn("Browser does not support geolocation. Defaulting to NYC.");
    }
  } catch (error) {
    console.error("Error initializing Google Map:", error);
    mapElement.innerHTML = `<p style="color: red; text-align: center;">Could not load the map. ${error.message}.</p>`;
  }
}

// Function to fetch shelters from the backend API
async function fetchAndDisplayShelters() {
  try {
    const response = await fetch("/api/shelters");
    if (!response.ok) {
      throw new Error(
        `API error! Status: ${response.status} ${response.statusText}`
      );
    }
    const shelters = await response.json();
    displaySheltersOnMap(shelters);
  } catch (error) {
    console.error("Error fetching shelters:", error);
    const mapElement = document.getElementById("map");
    if (mapElement && mapElement.innerHTML === "") {
      // Check if map is empty (cleared "Loading map...")
      mapElement.innerHTML =
        '<p style="color: orange; text-align: center;">Could not load shelter data at this time.</p>';
    }
  }
}

// Function to display shelter markers on the map
function displaySheltersOnMap(shelters) {
  if (!map || typeof google === "undefined" || !google.maps.marker) {
    console.error(
      "Map object or Google Maps marker library is not initialized."
    );
    return;
  }
  const { AdvancedMarkerElement } = google.maps.marker;

  shelters.forEach((shelter) => {
    if (
      shelter.location &&
      shelter.location.coordinates &&
      shelter.location.coordinates.length === 2
    ) {
      const [lng, lat] = shelter.location.coordinates;

      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        isNaN(lat) ||
        isNaN(lng)
      ) {
        console.warn(
          `Invalid coordinates for shelter "${
            shelter.name || "Unknown"
          }": [${lng}, ${lat}]`
        );
        return;
      }

      const position = { lat, lng };
      const marker = new AdvancedMarkerElement({
        map: map,
        position: position,
        title: shelter.name || "Shelter Location",
      });

      const services =
        shelter.services && shelter.services.length > 0
          ? shelter.services.join(", ")
          : "N/A";
      const phone =
        shelter.contactInfo && shelter.contactInfo.phone
          ? shelter.contactInfo.phone
          : "N/A";

      const contentString = `
        <div class="infowindow-content">
          <h3>${shelter.name || "Unnamed Shelter"}</h3>
          <p><strong>Address:</strong> ${shelter.address || "N/A"}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Services:</strong> ${services}</p>
          <p><a href="/search.html?id=${
            shelter._id
          }" target="_blank" rel="noopener noreferrer">More Details</a></p>
        </div>
      `;

      marker.addListener("click", () => {
        infoWindow.close();
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
      });
    } else {
      console.warn(
        `Shelter "${shelter.name || "Unknown"}" (ID: ${
          shelter._id || "N/A"
        }) is missing valid location data.`
      );
    }
  });
}

/*
// REMOVE OR COMMENT OUT THE adjustContentMargin FUNCTION AND ITS LISTENERS
function adjustContentMargin() {
  const header = document.querySelector("header");
  const mapContainer = document.querySelector(".map-container");
  const aboutUs = document.querySelector(".about-us");

  if (header && mapContainer && aboutUs) {
    const headerHeight = header.offsetHeight;
    mapContainer.style.top = `${headerHeight}px`; 

    const mapContainerHeight = mapContainer.offsetHeight;
    aboutUs.style.marginTop = `${headerHeight + mapContainerHeight}px`;
  }
}

window.addEventListener("load", adjustContentMargin);
window.addEventListener("resize", adjustContentMargin);
*/

// Event listener for the search input on the main page
const mainSearchInput = document.getElementById("mainSearchInput");
const mainSearchButton = document.getElementById("mainSearchButton");

if (mainSearchInput && mainSearchButton) {
  mainSearchButton.addEventListener("click", () => {
    const searchTerm = mainSearchInput.value.trim();
    if (searchTerm) {
      // This search bar now primarily filters the map on the current page.
      // If you want it to also interact with the iframe, that's more complex.
      // For now, let's assume it's for map filtering (which needs to be implemented)
      console.log("Map search term:", searchTerm);
      // Example: You might refetch shelters with this search term as a query parameter
      // fetchAndDisplayShelters(searchTerm); // You'd need to modify fetchAndDisplayShelters
    }
  });

  mainSearchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      mainSearchButton.click();
    }
  });
}
