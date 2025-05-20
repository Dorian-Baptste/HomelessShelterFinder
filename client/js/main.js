// client/js/main.js
// Handles main page logic, primarily Google Maps initialization and display.

let map; // Google Map object
let infoWindow; // InfoWindow for map markers
const NYC_COORDS = { lat: 40.7128, lng: -74.0060 }; // Default to NYC
let allSheltersData = []; // To store initially fetched shelter data
let currentMarkers = []; // To keep track of markers on the map

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
      mapId: "HOMELESS_SHELTER_MAP_DASHBOARD_V2",
      gestureHandling: "greedy",
    });

    infoWindow = new google.maps.InfoWindow({
      pixelOffset: new google.maps.Size(0, -10),
      maxWidth: 320,
    });

    console.log("Map initialized. Fetching initial shelters...");
    await fetchAndStoreInitialShelters();

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

// Function to fetch initial shelters from the backend API and store them
async function fetchAndStoreInitialShelters() {
  console.log("Attempting to fetch shelters from /api/shelters...");
  try {
    const response = await fetch("/api/shelters");
    console.log("API Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text(); // Get more details on the error
      console.error("API Error Details:", errorText);
      throw new Error(
        `API error! Status: ${response.status} ${response.statusText}`
      );
    }

    const shelters = await response.json();
    console.log("Fetched shelters data:", shelters); // <<< IMPORTANT LOG

    if (shelters && Array.isArray(shelters)) {
        allSheltersData = shelters;
        console.log(`Stored ${allSheltersData.length} shelters in allSheltersData.`);
        displaySheltersOnMap(allSheltersData);
    } else {
        console.error("Fetched data is not a valid array:", shelters);
        allSheltersData = []; // Ensure it's an array even if fetch failed
        displaySheltersOnMap(allSheltersData); // Display empty (will show "no shelters")
    }

  } catch (error) {
    console.error("Error in fetchAndStoreInitialShelters:", error);
    allSheltersData = []; // Ensure it's an array on error
    displaySheltersOnMap(allSheltersData); // Attempt to display (will show "no shelters")

    const mapElement = document.getElementById("map");
    if (mapElement && (mapElement.innerHTML.includes("Loading map...") || mapElement.innerHTML === "")) {
      mapElement.innerHTML =
        '<p style="color: orange; text-align: center; padding-top: 20px;">Could not load shelter data. Please check console for errors.</p>';
    }
  }
}

// Function to filter and display shelters based on a search term
function filterAndDisplayShelters(searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    console.log(`Filtering with term: "${lowerCaseSearchTerm}"`);
    const filteredShelters = allSheltersData.filter(shelter => {
        return (
            (shelter.name && shelter.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (shelter.address && shelter.address.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (shelter.services && shelter.services.some(s => s.toLowerCase().includes(lowerCaseSearchTerm))) ||
            (shelter.eligibility && shelter.eligibility.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (shelter.notes && shelter.notes.toLowerCase().includes(lowerCaseSearchTerm))
        );
    });
    console.log(`Found ${filteredShelters.length} shelters after filtering.`);
    displaySheltersOnMap(filteredShelters);
}

// Function to clear existing markers from the map
function clearMarkers() {
  currentMarkers.forEach(marker => {
    marker.map = null;
  });
  currentMarkers = [];
  // console.log("Cleared existing markers.");
}

// Function to display shelter markers on the map
function displaySheltersOnMap(sheltersToDisplay) {
  if (!map || typeof google === "undefined" || !google.maps.marker) {
    console.error(
      "Map object or Google Maps marker library is not initialized."
    );
    return;
  }
  const { AdvancedMarkerElement } = google.maps.marker;

  clearMarkers();

  if (!sheltersToDisplay || sheltersToDisplay.length === 0) { // Added check for null/undefined
    console.log("No shelters to display on the map for the current filter/data."); // Line 151 (approx)
    return;
  }
  console.log(`Displaying ${sheltersToDisplay.length} shelters on map.`);

  sheltersToDisplay.forEach((shelter) => {
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
      currentMarkers.push(marker);

      let shelterTypeInfo = "General Services";
      if (shelter.services && shelter.services.length > 0) {
        const servicesLower = shelter.services.map(s => s.toLowerCase());
        if (servicesLower.some(s => s.includes("family"))) shelterTypeInfo = "Family Resources";
        else if (servicesLower.some(s => s.includes("youth"))) shelterTypeInfo = "Youth Services";
        else if (servicesLower.some(s => s.includes("women"))) shelterTypeInfo = "Women's Shelter";
        else if (servicesLower.some(s => s.includes("men"))) shelterTypeInfo = "Men's Shelter";
        else if (servicesLower.some(s => s.includes("medical"))) shelterTypeInfo = "Medical Assistance";
        else if (servicesLower.some(s => s.includes("emergency"))) shelterTypeInfo = "Emergency Shelter";
        else {
          shelterTypeInfo = `Services: ${shelter.services.slice(0, 2).join(', ')}${shelter.services.length > 2 ? '...' : ''}`;
        }
      }

      const phone =
        shelter.contactInfo && shelter.contactInfo.phone
          ? shelter.contactInfo.phone
          : "N/A";

      const contentString = `
        <div class="infowindow-content">
          <h3>${shelter.name || "Unnamed Shelter"}</h3>
          <p><strong>Type:</strong> ${shelterTypeInfo}</p>
          <p><strong>Address:</strong> ${shelter.address || "N/A"}</p>
          <p><strong>Phone:</strong> ${phone}</p>
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

const mainSearchInput = document.getElementById("mainSearchInput");
const mainSearchButton = document.getElementById("mainSearchButton");

if (mainSearchInput && mainSearchButton) {
  mainSearchButton.addEventListener("click", () => {
    const searchTerm = mainSearchInput.value.trim();
    filterAndDisplayShelters(searchTerm);
  });

  mainSearchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      mainSearchButton.click();
    }
  });
}
