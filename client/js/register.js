// client/js/register.js
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const authMessageDiv = document.getElementById("authMessage");

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      authMessageDiv.textContent = ""; // Clear previous messages
      authMessageDiv.className = "";

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document
        .getElementById("confirmPassword")
        .value.trim();

      if (!name || !email || !password || !confirmPassword) {
        authMessageDiv.textContent = "Please fill in all fields.";
        authMessageDiv.className = "error";
        return;
      }

      if (password !== confirmPassword) {
        authMessageDiv.textContent = "Passwords do not match.";
        authMessageDiv.className = "error";
        return;
      }

      if (password.length < 6) {
        authMessageDiv.textContent =
          "Password must be at least 6 characters long.";
        authMessageDiv.className = "error";
        return;
      }

      try {
        const response = await fetch("/api/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          authMessageDiv.textContent =
            "Registration successful! Redirecting to login...";
          authMessageDiv.className = "success";

          // Optionally store token and user info if backend returns it on register,
          // or just redirect to login. For now, we assume backend returns token on register.
          if (data.token && typeof storeAuthData === "function") {
            storeAuthData(data.token, data.user);
          }

          // Update navigation to reflect login state if token is returned
          if (
            data.token &&
            typeof updateNavOnLogin === "function" &&
            data.user
          ) {
            updateNavOnLogin(data.user.name);
            // Redirect to home after a short delay if registered and logged in
            setTimeout(() => {
              window.location.href = "/index.html";
            }, 1500);
          } else {
            // If no token on register, redirect to login page
            setTimeout(() => {
              window.location.href = "/login.html";
            }, 1500);
          }
        } else {
          authMessageDiv.textContent =
            data.message || "Registration failed. Please try again.";
          authMessageDiv.className = "error";
        }
      } catch (error) {
        console.error("Registration error:", error);
        authMessageDiv.textContent =
          "An error occurred during registration. Please try again.";
        authMessageDiv.className = "error";
      }
    });
  }
});
