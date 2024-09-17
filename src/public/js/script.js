document.addEventListener("DOMContentLoaded", () => {
  const handleInviteResponse = async (inviteId, status) => {
    console.log("Invite ID:", inviteId);

    try {
      const response = await fetch(
        `http://localhost:9000/api/v1/events/${inviteId}/invitation`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      console.log(result);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Select the single invite element
  const inviteElement = document.querySelector(".invite");

  // Get the invite ID from the data attribute
  const inviteId = inviteElement.dataset.id;

  console.log("Invite ID:", inviteId);

  // Attach event listeners to the buttons
  inviteElement.querySelector(".coming-btn").addEventListener("click", () => {
    handleInviteResponse(inviteId, "ACCEPTED");
  });

  inviteElement
    .querySelector(".not-coming-btn")
    .addEventListener("click", () => {
      handleInviteResponse(inviteId, "REJECTED");
    });
});
