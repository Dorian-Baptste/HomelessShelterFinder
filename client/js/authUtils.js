// client/js/authUtils.js

const TOKEN_KEY = "shelterFinderToken";
const USER_INFO_KEY = "shelterFinderUser";

function storeAuthData(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUserInfo() {
  const userJson = localStorage.getItem(USER_INFO_KEY);
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    console.error("Error parsing user info from localStorage", e);
    return null;
  }
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  window.location.href = "/index.html"; // Redirect to home after logout
}

// Function to create the user icon menu
function createUserIconMenu(navUl, userName) {
  // Clear any previous auth links/menus
  clearAuthElements(navUl);

  const menuContainer = document.createElement("li");
  menuContainer.className = "user-menu-container";

  const icon = document.createElement("i");
  icon.className = "fas fa-user-circle user-icon"; // Font Awesome icon

  const dropdown = document.createElement("div");
  dropdown.className = "user-dropdown";

  // Populate dropdown based on login state
  if (userName) {
    // --- LOGGED-IN STATE ---
    const header = document.createElement("div");
    header.className = "user-dropdown-header";
    header.textContent = `Logged in as:`;

    const nameDisplay = document.createElement("div");
    nameDisplay.className = "user-dropdown-header";
    nameDisplay.style.fontWeight = "normal";
    nameDisplay.style.borderBottom = "1px solid #eee";
    nameDisplay.textContent = userName;

    const logoutItem = document.createElement("a");
    logoutItem.className = "user-dropdown-item";
    logoutItem.textContent = "Logout";
    logoutItem.onclick = logout; // Call logout function on click

    dropdown.appendChild(header);
    dropdown.appendChild(nameDisplay);
    dropdown.appendChild(logoutItem);
  } else {
    // --- LOGGED-OUT STATE ---
    const loginItem = document.createElement("a");
    loginItem.className = "user-dropdown-item";
    loginItem.textContent = "Login";
    loginItem.href = "/login.html";

    dropdown.appendChild(loginItem);

    // Add the "Register" link to the main nav
    const registerLi = document.createElement("li");
    registerLi.innerHTML = '<a href="/register.html">REGISTER</a>';
    navUl.appendChild(registerLi);
  }

  menuContainer.appendChild(icon);
  menuContainer.appendChild(dropdown);
  navUl.appendChild(menuContainer);

  // Event listener to toggle dropdown visibility
  icon.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent window click event from firing immediately
    dropdown.classList.toggle("show");
  });
}

// Helper to remove existing auth elements before redrawing
function clearAuthElements(navUl) {
  const elementsToRemove = navUl.querySelectorAll(
    '.user-menu-container, .user-status-li, .logout-li, a[href="/login.html"], a[href="/register.html"]'
  );
  elementsToRemove.forEach((el) => el.parentElement.remove());
}

// Main function to update nav on page load
document.addEventListener("DOMContentLoaded", () => {
  const navUl = document.querySelector("header nav ul");
  if (!navUl) return;

  if (isLoggedIn()) {
    const user = getUserInfo();
    updateNavOnLogin(user ? user.name : "User");
  } else {
    updateNavOnLogout();
  }

  // Close dropdown if user clicks outside of it
  window.addEventListener("click", (event) => {
    const dropdown = document.querySelector(".user-dropdown");
    if (
      dropdown &&
      dropdown.classList.contains("show") &&
      !event.target.matches(".user-icon")
    ) {
      dropdown.classList.remove("show");
    }
  });
});

// Simplified functions to call our new menu creator
function updateNavOnLogin(userName) {
  const navUl = document.querySelector("header nav ul");
  if (navUl) createUserIconMenu(navUl, userName);
}

function updateNavOnLogout() {
  const navUl = document.querySelector("header nav ul");
  if (navUl) createUserIconMenu(navUl, null);
}
