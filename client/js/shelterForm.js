// client/js/shelterForm.js
// Handles logic for the shelters.html page (adding/editing shelters)

document.addEventListener("DOMContentLoaded", () => {
  const shelterForm = document.getElementById("addShelterForm");
  const formMessage = document.getElementById("formMessage"); // For displaying success/error messages

  // Handle service tag selection
  const serviceTagsContainer = document.querySelector(".services-tags");
  if (serviceTagsContainer) {
    serviceTagsContainer.addEventListener("click", (event) => {
      if (event.target.classList.contains("tag")) {
        event.target.classList.toggle("selected");
      }
    });
  }

  if (shelterForm) {
    shelterForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent default form submission

      if (formMessage) formMessage.textContent = ""; // Clear previous messages
      if (formMessage) formMessage.className = "";

      // Collect form data
      const formData = new FormData(shelterForm);
      const shelterData = {};
      formData.forEach((value, key) => {
        shelterData[key] = value.trim();
      });

      // Collect selected services
      const selectedServiceElements = serviceTagsContainer
        ? serviceTagsContainer.querySelectorAll(".tag.selected")
        : [];
      shelterData.services = Array.from(selectedServiceElements).map(
        (tag) => tag.dataset.service
      );

      // Client-side validation (basic example)
      if (!shelterData.name || !shelterData.address) {
        if (formMessage) {
          formMessage.textContent = "Shelter Name and Address are required.";
          formMessage.className = "error"; // Add a class for styling
        }
        return;
      }

      // TODO: Add more robust validation for other fields (email, phone, capacity etc.)

      try {
        // Make API call to POST data to the backend
        const response = await fetch("/api/shelters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(shelterData),
        });

        const responseData = await response.json();

        if (response.ok) {
          if (formMessage) {
            formMessage.textContent = "Shelter added successfully!";
            formMessage.className = "success"; // Add a class for styling
          }
          shelterForm.reset(); // Reset the form
          // Clear selected tags visually
          if (selectedServiceElements)
            selectedServiceElements.forEach((tag) =>
              tag.classList.remove("selected")
            );

          // Optionally, redirect or update UI
          // window.location.href = '/search.html'; // Example redirect
        } else {
          // Handle errors from the server
          let errorMessage = "Failed to add shelter.";
          if (responseData.message) {
            errorMessage = responseData.message;
          }
          if (responseData.errors) {
            // For Mongoose validation errors
            const errorDetails = Object.values(responseData.errors)
              .map((err) => err.message)
              .join(", ");
            errorMessage += ` Details: ${errorDetails}`;
          }
          if (formMessage) {
            formMessage.textContent = errorMessage;
            formMessage.className = "error";
          }
        }
      } catch (error) {
        console.error("Error submitting shelter form:", error);
        if (formMessage) {
          formMessage.textContent =
            "An unexpected error occurred. Please try again.";
          formMessage.className = "error";
        }
      }
    });
  } else {
    console.warn("Shelter form not found on shelters.html");
  }
});
