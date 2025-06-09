document.addEventListener("DOMContentLoaded", () => {
  const usersListContainer = document.getElementById("users-list-container");

  // Check if user is logged in before trying to fetch data
  if (!isLoggedIn()) {
    usersListContainer.innerHTML = `
            <p style="text-align: center; font-size: 1.1em;">
                You must be <a href="/login.html">logged in</a> to view this page.
            </p>
        `;
    return;
  }

  loadAllUsers();

  async function loadAllUsers() {
    usersListContainer.innerHTML = "<p>Loading users...</p>";
    const token = getToken(); // Get token from authUtils.js

    try {
      const response = await fetch("/api/users/all", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Could not fetch users.");
      }

      const users = await response.json();
      displayUsers(users);
    } catch (error) {
      usersListContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }

  function displayUsers(users) {
    usersListContainer.innerHTML = "";

    if (users.length === 0) {
      usersListContainer.innerHTML = "<p>No users found.</p>";
      return;
    }

    users.forEach((user) => {
      const userDiv = document.createElement("div");
      // Reuse the .result-item style from search.css for consistency
      userDiv.classList.add("result-item");

      userDiv.innerHTML = `
                <h3 class="result-title" style="margin-bottom: 5px;">${user.name}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
            `;
      usersListContainer.appendChild(userDiv);
    });
  }
});
