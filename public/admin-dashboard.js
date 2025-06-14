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

    if (currentStatus === "users") {
      fetchUsers();
    } else {
      fetchCampaigns(currentStatus);
      fetchCharities(currentStatus);
    }
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

async function fetchUsers() {
  try {
    const res = await axios.get(`/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    renderUsers(res.data);
  } catch (err) {
    console.error("Failed to fetch users", err);
  }
}

function renderUsers(users) {
  const userContainer = document.getElementById("userContainer");
  userContainer.innerHTML = "";
  campaignContainer.innerHTML = ""; // hide others
  charityContainer.innerHTML = "";

  if (users.length === 0) {
    userContainer.innerHTML = "<p>No users to show.</p>";
    return;
  }

  users.forEach((u) => {
    const div = document.createElement("div");
    div.className = "campaign"; // same style
    div.innerHTML = `
      <h3>${u.name} (${u.email})</h3>
      <p><strong>Status:</strong> ${u.isActive ? "Active" : "Inactive"}</p>
      <button onclick="toggleUserStatus(${u.id}, ${!u.isActive})">
        ${u.isActive ? "Deactivate" : "Activate"}
      </button>
      <button onclick="deleteUser(${u.id})" style="background: #e74c3c; color: white;">
        Delete
      </button>
    `;
    userContainer.appendChild(div);
  });
}

async function toggleUserStatus(userId, newStatus) {
  try {
    await axios.put(
      `/api/admin/user/${userId}/status`,
      { isActive: newStatus },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchUsers();
  } catch (err) {
    console.error("Failed to update user status", err);
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    await axios.delete(`/api/admin/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  } catch (err) {
    console.error("Failed to delete user", err);
  }
}



// Initial load
fetchCampaigns(currentStatus);

fetchCharities(currentStatus);
