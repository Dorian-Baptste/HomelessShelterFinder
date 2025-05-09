// client/js/searchApp.js
// Handles logic for the search.html page

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const performSearchButton = document.getElementById("performSearchButton");
  const resultsContainer = document.getElementById("resultsContainer");
  const paginationContainer = document.getElementById("paginationContainer"); // Assuming you'll add pagination

  // Function to fetch and display search results
  async function performSearch(query = "") {
    if (!resultsContainer) {
      console.error("Results container not found");
      return;
    }
    resultsContainer.innerHTML = "<p>Loading results...</p>"; // Loading indicator

    try {
      // Example: ?q=searchTerm&services=food,medical
      // You'll need to build the query string based on available filters on your search page
      const apiUrl = `/api/shelters?search=${encodeURIComponent(query)}`;
      // Add more query parameters for filters (services, location, etc.) if you have them

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const shelters = await response.json();
      displayResults(shelters);
    } catch (error) {
      console.error("Error performing search:", error);
      resultsContainer.innerHTML =
        '<p style="color: red;">Error loading results. Please try again.</p>';
    }
  }

  // Function to display results in the HTML
  function displayResults(shelters) {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = ""; // Clear previous results or loading message

    if (shelters.length === 0) {
      resultsContainer.innerHTML =
        "<p>No shelters found matching your criteria.</p>";
      return;
    }

    shelters.forEach((shelter) => {
      const shelterDiv = document.createElement("div");
      shelterDiv.classList.add("result-item");

      // Sanitize content before inserting if it comes directly from user input elsewhere,
      // but here it's from our DB, so it should be relatively safe.
      // However, for descriptions or notes, always be cautious.
      let servicesList =
        shelter.services && shelter.services.length > 0
          ? shelter.services.join(", ")
          : "N/A";
      let phone =
        shelter.contactInfo && shelter.contactInfo.phone
          ? shelter.contactInfo.phone
          : "N/A";

      shelterDiv.innerHTML = `
        <h3 class="result-title"><a href="#">${shelter.name}</a></h3>
        <p class="result-address"><strong>Address:</strong> ${
          shelter.address || "N/A"
        }</p>
        <p class="result-phone"><strong>Phone:</strong> ${phone}</p>
        <p class="result-services"><strong>Services:</strong> ${servicesList}</p>
        <p class="result-eligibility"><strong>Eligibility:</strong> ${
          shelter.eligibility || "N/A"
        }</p>
        <p class="result-hours"><strong>Hours:</strong> ${
          shelter.operatingHours || "N/A"
        }</p>
        ${
          shelter.notes
            ? `<p class="result-description"><strong>Notes:</strong> ${shelter.notes}</p>`
            : ""
        }
        `;
      // Example: Add event listener to title to show more details or highlight on map
      // shelterDiv.querySelector('.result-title a').addEventListener('click', (e) => {
      //   e.preventDefault();
      //   alert(`Displaying details for ${shelter.name}`);
      //   // Potentially, you could have a modal or redirect to a detailed view
      // });

      resultsContainer.appendChild(shelterDiv);
    });

    // Basic pagination (to be implemented more robustly)
    // displayPagination(shelters.length /*, itemsPerPage, currentPage */);
  }

  // --- Event Listeners ---
  if (performSearchButton && searchInput) {
    performSearchButton.addEventListener("click", () => {
      const query = searchInput.value.trim();
      performSearch(query);
    });

    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        performSearchButton.click();
      }
    });
  } else {
    console.warn("Search input or button not found on search.html");
  }

  // --- Initial Load ---
  // Check for query parameters on page load (e.g., from homepage search)
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get("q"); // For general search term
  const shelterId = urlParams.get("id"); // For specific shelter ID

  if (shelterId) {
    // Fetch and display a single shelter's details
    async function fetchSingleShelter(id) {
      resultsContainer.innerHTML = "<p>Loading shelter details...</p>";
      try {
        const response = await fetch(`/api/shelters/${id}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const shelter = await response.json();
        if (shelter) {
          displayResults([shelter]); // displayResults expects an array
        } else {
          resultsContainer.innerHTML = "<p>Shelter not found.</p>";
        }
      } catch (error) {
        console.error("Error fetching single shelter:", error);
        resultsContainer.innerHTML =
          '<p style="color: red;">Error loading shelter details.</p>';
      }
    }
    fetchSingleShelter(shelterId);
    if (searchInput) searchInput.value = ""; // Clear search bar if viewing specific shelter
  } else if (initialQuery) {
    if (searchInput) searchInput.value = initialQuery;
    performSearch(initialQuery);
  } else {
    // Perform a default search or show all shelters if no query
    performSearch(""); // Fetches all shelters by default if backend handles empty search this way
  }
});
