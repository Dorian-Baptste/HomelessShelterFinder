// client/js/myShelters.js
document.addEventListener("DOMContentLoaded", () => {
  const bookmarksListContainer = document.getElementById(
    "bookmarkedSheltersList"
  );

  if (!isLoggedIn()) {
    bookmarksListContainer.innerHTML = `
            <p style="text-align: center; font-size: 1.1em;">
                Please <a href="/login.html">log in</a> to view your bookmarked shelters.
            </p>
        `;
    return;
  }

  loadBookmarkedShelters();

  async function loadBookmarkedShelters() {
    bookmarksListContainer.innerHTML = "<p>Loading your shelters...</p>";
    const token = getToken();

    try {
      const response = await fetch("/api/users/bookmarks", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Could not fetch your bookmarked shelters.");
      }

      const shelters = await response.json();
      displayBookmarkedShelters(shelters);
    } catch (error) {
      bookmarksListContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }

  function displayBookmarkedShelters(shelters) {
    bookmarksListContainer.innerHTML = "";

    if (shelters.length === 0) {
      bookmarksListContainer.innerHTML =
        "<p>You have not bookmarked any shelters yet. You can bookmark shelters from the search page.</p>";
      return;
    }

    shelters.forEach((shelter) => {
      const shelterDiv = document.createElement("div");
      shelterDiv.classList.add("result-item");
      shelterDiv.setAttribute("id", `bookmark-${shelter._id}`);

      shelterDiv.innerHTML = `
                <h3 class="result-title"><a>${shelter.name}</a></h3>
                <p class="result-address"><strong>Address:</strong> ${
                  shelter.address || "N/A"
                }</p>
                <p class="result-phone"><strong>Phone:</strong> ${
                  shelter.contactInfo?.phone || "N/A"
                }</p>
                <p class="result-services"><strong>Services:</strong> ${
                  shelter.services?.join(", ") || "N/A"
                }</p>
                <button class="remove-bookmark-btn" data-shelter-id="${
                  shelter._id
                }">Remove Bookmark</button>
            `;
      bookmarksListContainer.appendChild(shelterDiv);
    });
  }

  // Add delegated event listener to handle removing bookmarks
  bookmarksListContainer.addEventListener("click", async (event) => {
    if (event.target.classList.contains("remove-bookmark-btn")) {
      const shelterId = event.target.dataset.shelterId;
      const token = getToken();

      if (confirm("Are you sure you want to remove this bookmark?")) {
        try {
          const response = await fetch(`/api/users/bookmarks/${shelterId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            // Remove the item from the view
            document.getElementById(`bookmark-${shelterId}`).remove();
          } else {
            alert("Failed to remove bookmark.");
          }
        } catch (error) {
          console.error("Error removing bookmark:", error);
          alert("An error occurred.");
        }
      }
    }
  });
});
