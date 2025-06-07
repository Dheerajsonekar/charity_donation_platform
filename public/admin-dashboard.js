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
const charityContainer = document.getElementById("charityContainer");

let currentStatus = "pending";

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentStatus = tab.dataset.status;

    fetchCampaigns(currentStatus);
  });
});

// for campaigns
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

// for charities
async function fetchCharities(status) {
  try {
    const res = await axios.get(`/api/admin/charities/${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    renderCharities(res.data);
  } catch (err) {
    console.error("failed to fetch campaigns", err);
  }
}

// for render campaign 
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
          <h3>${c.campaignTitle}</h3>
          <p><strong>Goal:</strong> ₹${c.goalAmount}</p>
          <p>${c.campaignDescription}</p>
         
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

//for render charities
function renderCharities(charities) {
  charityContainer.innerHTML = "";
  if (charities.length === 0) {
    charityContainer.innerHTML = "<p>No no charity to show.</p>";
    return;
  }

  charities.forEach((c) => {
    const div = document.createElement("div");
    div.className = "campaign";
    div.innerHTML = `
          <h3>${c.registrationNumber}</h3>
          <p><strong>Goal:</strong> ${c.name}</p>
          <p>${c.description}</p>
          <p><a href=${c.website}>${c.website}</a></p>
         
          ${
            currentStatus === "pending"
              ? `
            <button onclick="updateCharityStatus(${c.id}, 'approved')">Approve</button>
            <button onclick="updateCharityStatus(${c.id}, 'rejected')">Reject</button>
          `
              : ""
          }
        `;
    charityContainer.appendChild(div);
  });
}

// for campaign
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

//for charities
async function updateCharityStatus(id, status) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.put(
      `/api/admin/charity/${status}/${id}`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    fetchCharities(currentStatus);
  } catch (err) {
   console.error("failed to update campaign status", err);
  }
}

// Initial load
fetchCampaigns(currentStatus);

fetchCharities(currentStatus);
