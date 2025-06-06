// client/js/searchApp.js

// This set will hold the IDs of shelters the user has bookmarked.
let userBookmarks = new Set();

// This new function checks which shelters the logged-in user has already bookmarked.
async function fetchUserBookmarks() {
  // The isLoggedIn and getToken functions come from your authUtils.js file.
  if (!isLoggedIn()) return;

  try {
    const token = getToken();
    const response = await fetch("/api/users/bookmarks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const bookmarks = await response.json();
      // Store the IDs in our set for quick checking.
      userBookmarks = new Set(bookmarks.map((b) => b._id));
    }
  } catch (error) {
    console.error("Could not fetch user bookmarks:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Call the function to get bookmarks when the page loads
  await fetchUserBookmarks();

  const searchInput = document.getElementById("searchInput");
  const performSearchButton = document.getElementById("performSearchButton");
  const resultsContainer = document.getElementById("resultsContainer");

  // Function to fetch and display search results
  async function performSearch(query = "") {
    if (!resultsContainer) {
      console.error("Results container not found");
      return;
    }
    resultsContainer.innerHTML = "<p>Loading results...</p>";

    try {
      const apiUrl = `/api/shelters?search=${encodeURIComponent(query)}`;
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
    resultsContainer.innerHTML = "";

    if (shelters.length === 0) {
      resultsContainer.innerHTML =
        "<p>No shelters found matching your criteria.</p>";
      return;
    }

    const loggedIn = isLoggedIn();

    shelters.forEach((shelter) => {
      const shelterDiv = document.createElement("div");
      shelterDiv.classList.add("result-item");

      let servicesList =
        shelter.services && shelter.services.length > 0
          ? shelter.services.join(", ")
          : "N/A";
      let phone =
        shelter.contactInfo && shelter.contactInfo.phone
          ? shelter.contactInfo.phone
          : "N/A";

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
        ${bookmarkButtonHTML} 
      `;

      resultsContainer.appendChild(shelterDiv);
    });
  }

  // Event Listeners for search
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

  // Event listener for bookmark buttons
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
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (err) {
        console.error("Bookmark toggle failed:", err);
        alert("An error occurred. Please try again.");
      }
    }
  });

  // Initial Load Logic
  performSearch(""); // This will fetch and display all shelters on initial load
});
