const token = localStorage.getItem("token");

const form = document.getElementById("campaignForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const goal = document.getElementById("goal").value;
  const description = document.getElementById("description").value;

  try {
    const response = await axios.post(
      "/api/start/campaigns",
      {
        title,
        goal,
        description,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    alert("Campaign created successfully!");
    form.reset();
    window.location.href = "./allCampaign.html"
  } catch (error) {
    console.error(error);
    alert("Error creating campaign.");
  }
});
