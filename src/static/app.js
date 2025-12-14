document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Force fresh data from the server to avoid cached responses
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `<ul class="participants-list">
            ${details.participants.map(p => `<li data-email="${p}">${p} <button class="participant-delete" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">✖</button></li>`).join("")}
          </ul>`;
        } else {
          participantsHtml = `<div class="participants-empty">No participants yet.</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach event delegation for delete buttons (one-time listener)
        // We'll attach at the container level outside the loop below if not already attached.

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Ensure a single delegated click handler for deletion is present
      if (!activitiesList._hasDeleteHandler) {
        activitiesList.addEventListener('click', async (e) => {
          if (!e.target.matches('.participant-delete')) return;

          const activity = e.target.dataset.activity;
          const email = e.target.dataset.email;

          if (!activity || !email) return;

          try {
            const resp = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'POST' });
            const result = await resp.json();

            if (resp.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = 'success';
              messageDiv.classList.remove('hidden');
              // Refresh activities to show updated participants
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || 'Failed to remove participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }

            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          } catch (err) {
            console.error('Error unregistering participant:', err);
            messageDiv.textContent = 'Failed to remove participant. Please try again.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
          }
        });
        activitiesList._hasDeleteHandler = true;
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to show updated participants
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
