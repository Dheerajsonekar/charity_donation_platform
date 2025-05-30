const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in as admin.");
  window.location.href = "/admin-login.html";
}
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/admin-login.html";
}

const tabs = document.querySelectorAll(".tab");
const campaignContainer = document.getElementById("campaignContainer");
let currentStatus = "pending";

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentStatus = tab.dataset.status;

    fetchCampaigns(currentStatus);
  });
});

async function fetchCampaigns(status) {
  try {
    const res = await axios.get(`/api/admin/campaigns/${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    renderCampaigns(res.data);
  } catch (err) {
    console.error("failed to fetch campaigns", err);
  }
}

function renderCampaigns(campaigns) {
  campaignContainer.innerHTML = "";
  if (campaigns.length === 0) {
    campaignContainer.innerHTML = "<p>No campaigns to show.</p>";
    return;
  }

  campaigns.forEach((c) => {
    const div = document.createElement("div");
    div.className = "campaign";
    div.innerHTML = `
          <h3>${c.title}</h3>
          <p><strong>Goal:</strong> ₹${c.goal}</p>
          <p>${c.description}</p>
         
          ${
            currentStatus === "pending"
              ? `
            <button onclick="updateStatus(${c.id}, 'approved')">Approve</button>
            <button onclick="updateStatus(${c.id}, 'rejected')">Reject</button>
          `
              : ""
          }
        `;
    campaignContainer.appendChild(div);
  });
}

async function updateStatus(id, status) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.put(
      `/api/admin/campaign/${status}/${id}`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    fetchCampaigns(currentStatus);
  } catch (err) {
   console.error("failed to update campaign status", err);
  }
}

// Initial load
fetchCampaigns(currentStatus);
