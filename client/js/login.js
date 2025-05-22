// client/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const authMessageDiv = document.getElementById("authMessage");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      authMessageDiv.textContent = ""; // Clear previous messages
      authMessageDiv.className = "";

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        authMessageDiv.textContent = "Please enter both email and password.";
        authMessageDiv.className = "error";
        return;
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          authMessageDiv.textContent = "Login successful! Redirecting...";
          authMessageDiv.className = "success";

          // Store token and user info using functions from authUtils.js
          if (typeof storeAuthData === "function") {
            storeAuthData(data.token, data.user);
          } else {
            console.error("storeAuthData function is not available.");
            // Fallback to direct localStorage (not recommended for maintainability)
            // localStorage.setItem('shelterFinderToken', data.token);
            // localStorage.setItem('shelterFinderUser', JSON.stringify(data.user));
          }

          // Update navigation to reflect login state
          if (typeof updateNavOnLogin === "function" && data.user) {
            updateNavOnLogin(data.user.name);
          }

          // Redirect to homepage after a short delay
          setTimeout(() => {
            window.location.href = "/index.html";
          }, 1500);
        } else {
          authMessageDiv.textContent =
            data.message || "Login failed. Please check your credentials.";
          authMessageDiv.className = "error";
        }
      } catch (error) {
        console.error("Login error:", error);
        authMessageDiv.textContent =
          "An error occurred during login. Please try again.";
        authMessageDiv.className = "error";
      }
    });
  }
});
