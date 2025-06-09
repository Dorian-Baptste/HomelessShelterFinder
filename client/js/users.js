document.addEventListener("DOMContentLoaded", () => {
  // This now correctly targets the <tbody> element from your HTML
  const tableBody = document.getElementById("users-list-body");

  // If the user isn't logged in, display a message and stop.
  if (!isLoggedIn()) {
    const mainContent = document.querySelector(".bookmarks-container");
    if (mainContent) {
      mainContent.innerHTML = `
                <p style="text-align: center; font-size: 1.1em;">
                    You must be <a href="/login.html">logged in</a> to view this page.
                </p>
            `;
    }
    return;
  }

  // Proceed to load the users if logged in
  loadAllUsers();

  async function loadAllUsers() {
    // Check if the table body element exists before trying to use it
    if (!tableBody) {
      console.error("The element with ID 'users-list-body' was not found.");
      return;
    }

    // Display a loading message inside the table
    tableBody.innerHTML = ""; // Clear any previous content
    const loadingRow = tableBody.insertRow();
    const loadingCell = loadingRow.insertCell();
    loadingCell.colSpan = 2;
    loadingCell.textContent = "Loading users...";
    loadingCell.style.textAlign = "center";

    const token = getToken();

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
      // Display error message in the table
      tableBody.innerHTML = "";
      const errorRow = tableBody.insertRow();
      const errorCell = errorRow.insertCell();
      errorCell.colSpan = 2;
      errorCell.textContent = error.message;
      errorCell.style.textAlign = "center";
      errorCell.style.color = "red";
    }
  }

  function displayUsers(users) {
    if (!tableBody) return;
    tableBody.innerHTML = ""; // Clear loading message

    if (users.length === 0) {
      const emptyRow = tableBody.insertRow();
      const emptyCell = emptyRow.insertCell();
      emptyCell.colSpan = 2;
      emptyCell.textContent = "No users found.";
      emptyCell.style.textAlign = "center";
      return;
    }

    users.forEach((user) => {
      const row = tableBody.insertRow();

      const nameCell = row.insertCell();
      nameCell.textContent = user.name;

      const emailCell = row.insertCell();
      emailCell.textContent = user.email;
    });
  }
});
