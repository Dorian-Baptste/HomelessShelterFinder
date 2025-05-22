// client/js/authUtils.js

const TOKEN_KEY = "shelterFinderToken";
const USER_INFO_KEY = "shelterFinderUser";

// Store token and user info in localStorage
function storeAuthData(token, user) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    }
  } else {
    console.warn("localStorage is not available. Auth data will not persist.");
  }
}

// Get token from localStorage
function getToken() {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

// Get user info from localStorage
function getUserInfo() {
  if (typeof localStorage !== "undefined") {
    const userJson = localStorage.getItem(USER_INFO_KEY);
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      console.error("Error parsing user info from localStorage", e);
      return null;
    }
  }
  return null;
}

// Check if user is logged in
function isLoggedIn() {
  return !!getToken(); // User is logged in if a token exists
}

// Logout: Remove token and user info
function logout() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    // Optionally, redirect to homepage or login page
    // window.location.href = '/login.html';
    console.log("User logged out.");
    updateNavOnLogout(); // Update navigation immediately
  }
}

// Function to update navigation based on login status
// This should be called on page load and after login/logout
function updateNavOnLogin(userName) {
  const navUl = document.querySelector("header nav ul");
  if (!navUl) return;

  // Remove existing login/register links if they exist
  const loginLink = navUl.querySelector('a[href="/login.html"]');
  const registerLink = navUl.querySelector('a[href="/register.html"]');
  if (loginLink) loginLink.parentElement.remove();
  if (registerLink) registerLink.parentElement.remove();

  // Remove existing "Logged in as" or "Logout" if they exist to prevent duplicates
  const existingUserLi = navUl.querySelector(".user-status-li");
  if (existingUserLi) existingUserLi.remove();
  const existingLogoutLi = navUl.querySelector(".logout-li");
  if (existingLogoutLi) existingLogoutLi.remove();

  // Add "Logged in as [Name]" and Logout button
  const loggedInAsLi = document.createElement("li");
  loggedInAsLi.classList.add("user-status-li");
  loggedInAsLi.textContent = `Logged in as: ${userName}`;
  loggedInAsLi.style.color = "white"; // Or match nav link color
  loggedInAsLi.style.padding = "8px 12px";
  loggedInAsLi.style.fontWeight = "500";

  const logoutLi = document.createElement("li");
  logoutLi.classList.add("logout-li");
  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Logout";
  logoutButton.id = "logoutButton"; // For event listener
  // Basic styling for logout button to somewhat match nav links
  logoutButton.style.background = "none";
  logoutButton.style.border = "1px solid white";
  logoutButton.style.color = "white";
  logoutButton.style.padding = "6px 12px";
  logoutButton.style.borderRadius = "5px";
  logoutButton.style.cursor = "pointer";
  logoutButton.style.fontWeight = "500";
  logoutButton.style.fontFamily = "sans-serif";
  logoutButton.style.fontSize = "inherit"; // Inherit font size from parent li/nav

  logoutButton.addEventListener("click", () => {
    logout(); // Call the logout function from this file
    window.location.href = "/index.html"; // Redirect to home after logout
  });
  logoutLi.appendChild(logoutButton);

  navUl.appendChild(loggedInAsLi);
  navUl.appendChild(logoutLi);
}

function updateNavOnLogout() {
  const navUl = document.querySelector("header nav ul");
  if (!navUl) return;

  // Remove "Logged in as" and "Logout"
  const loggedInAsLi = navUl.querySelector(".user-status-li");
  const logoutLi = navUl.querySelector(".logout-li");
  if (loggedInAsLi) loggedInAsLi.remove();
  if (logoutLi) logoutLi.remove();

  // Remove existing login/register links if they exist to prevent duplicates
  const existingLoginLink = navUl.querySelector('a[href="/login.html"]');
  const existingRegisterLink = navUl.querySelector('a[href="/register.html"]');
  if (existingLoginLink) existingLoginLink.parentElement.remove();
  if (existingRegisterLink) existingRegisterLink.parentElement.remove();

  // Add Login and Register links
  const loginLi = document.createElement("li");
  const loginLinkNav = document.createElement("a");
  loginLinkNav.href = "/login.html";
  loginLinkNav.textContent = "LOGIN";
  loginLi.appendChild(loginLinkNav);

  const registerLi = document.createElement("li");
  const registerLinkNav = document.createElement("a");
  registerLinkNav.href = "/register.html";
  registerLinkNav.textContent = "REGISTER";
  registerLi.appendChild(registerLinkNav);

  // Find the "ADD A SHELTER" link to insert before it, or append if not found
  const addShelterLink = navUl.querySelector('a[href="/shelters.html"]');
  if (addShelterLink && addShelterLink.parentElement.nextSibling) {
    navUl.insertBefore(registerLi, addShelterLink.parentElement.nextSibling);
    navUl.insertBefore(loginLi, registerLi);
  } else if (addShelterLink) {
    navUl.appendChild(loginLi);
    navUl.appendChild(registerLi);
  } else {
    // If "ADD A SHELTER" isn't there, just append
    navUl.appendChild(loginLi);
    navUl.appendChild(registerLi);
  }
}

// Call this on every page load to set the correct nav state
document.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn()) {
    const user = getUserInfo();
    if (user && user.name) {
      updateNavOnLogin(user.name);
    } else {
      // Fallback if user info is not stored but token exists
      // Might need to fetch user info or just show generic logged in state
      console.warn("Logged in, but user name not found in localStorage.");
      updateNavOnLogin("User"); // Or fetch user details from a /api/auth/user endpoint
    }
  } else {
    updateNavOnLogout();
  }
});
