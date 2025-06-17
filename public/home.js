const token = localStorage.getItem("token");
const profileContainer = document.getElementById("profileContainer");
const dropdownMenu = document.getElementById("dropdownMenu");
const loginBtn = document.getElementById("loginBtn");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resetButton = document.getElementById("resetButton");
const campaignList = document.getElementById("campaignList");

// Authentication UI
if (token) {
  loginBtn.style.display = "none";
  profileContainer.style.display = "block";

  axios
    .get("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      // Update profile picture if available
     
      console.log("User profile data:", res.data);
      if (res.data.avatar) {
        document.getElementById(
          "profilePic"
        ).style.backgroundImage = `url(${res.data.avatar})`;
      }
      
    })
    .catch((err) => {
      console.error(err);
      localStorage.removeItem("token");
      loginBtn.style.display = "block";
      profileContainer.style.display = "none";
    });
}

// Navigation handlers
profileContainer.addEventListener("click", () => {
  dropdownMenu.style.display =
    dropdownMenu.style.display === "block" ? "none" : "block";
});

document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

loginBtn.addEventListener("click", () => {
  window.location.href = "/login.html";
});

// Mobile menu
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");
const authsection = document.querySelector(".auth-section");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
  authsection.classList.toggle("show");
});

window.addEventListener("click", (e) => {
  if (
    !hamburger.contains(e.target) &&
    !navLinks.contains(e.target) &&
    !authsection.contains(e.target)
  ) {
    navLinks.classList.remove("show");
    authsection.classList.remove("show");
  }
  if (!profileContainer.contains(e.target)) {
    dropdownMenu.style.display = "none";
  }
});

// Campaign functions
async function fetchCampaigns(searchTerm = "") {
  try {
    const response = await axios.get(
      `/api/campaigns?search=${encodeURIComponent(searchTerm)}`
      
    );
    displayCampaigns(response.data.campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    campaignList.innerHTML =
      '<p class="error">Error loading campaigns. Please try again later.</p>';
  }
}

function displayCampaigns(campaigns) {
  campaignList.innerHTML = "";

  if (campaigns.length === 0) {
    campaignList.innerHTML =
      '<p class="no-results">No campaigns found. Try a different search term.</p>';
    return;
  }

  campaigns.forEach((campaign) => {
    const progressPercent = Math.min(
      Math.round((campaign.amountRaised / campaign.goalAmount) * 100),
      100
    );

    const campaignDiv = document.createElement("div");
    campaignDiv.className = "campaign-card";

    campaignDiv.innerHTML = `
      <img src="${
        campaign.campaignImageUrl || "/placeholder-image.jpg"
      }" alt="${campaign.campaignTitle}" class="campaign-image">
      <h3>${campaign.campaignTitle.substring(0, 20)}</h3>
      <p class="description">${campaign.campaignDescription.substring(
        0,
        50
      )}...</p>
      <p class="organizer">By: ${campaign.campaignerName}</p>
      
      <div class="progress-container">
        <div class="progress-bar" style="width: ${progressPercent}%"></div>
      </div>
      <div class="progress-text">
        <span>Rs.${campaign.amountRaised || 0} raised</span>
        <span>${progressPercent}% of Rs.${campaign.goalAmount}</span>
      </div>
      
      <div class="campaign-buttons">
        <button class="share-btn" onclick="shareCampaign('${campaign.id}', '${
      campaign.campaignTitle
    }')">
          <i class="icon">↗</i> Share
        </button>
        <button class="donate-btn" onclick="initiateDonation('${campaign.id}')">
          <i class="icon">❤</i> Donate
        </button>
      </div>
    `;

    campaignList.appendChild(campaignDiv);
  });
}

// Search functionality
searchButton.addEventListener("click", () => {
  fetchCampaigns(searchInput.value);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    fetchCampaigns(searchInput.value);
  }
});

resetButton.addEventListener("click", () => {
  searchInput.value = "";
  fetchCampaigns();
});

// Razorpay integration
function initiateDonation(campaignId) {
  if (!token) {
    alert("Please login to donate");
    window.location.href = "/login.html";
    return;
  }

  const amount = prompt("Enter donation amount (INR):");
  if (!amount || isNaN(amount)) {
    alert("Please enter a valid amount");
    return;
  }

  axios
    .post(
      "/api/payments/create-order",
      {
        campaignId,
        amount: parseFloat(amount), 
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((response) => {
      const options = {
        key: response.data.razorpayKeyId, 
        amount: response.data.amount,
        currency: "INR",
        name: "DonateKart",
        description: `Donation for Campaign ${campaignId}`,
        order_id: response.data.id,
        handler: function (response) {
          verifyPayment(response, campaignId, amount);
        },
        prefill: {
          name: response.data.user.name,
          email: response.data.user.email,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    })
    .catch((error) => {
      console.error("Payment error:", error);
      alert("Error initiating payment. Please try again.");
    });
}

function verifyPayment(paymentResponse, campaignId, amount) {
  axios
    .post(
      "/api/payments/verify",
      {
        paymentResponse,
        campaignId,
        amount,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then(() => {
      alert("Payment successful! Thank you for your donation.");
      fetchCampaigns(); 
    })
    .catch((error) => {
      console.error("Payment verification failed:", error);
      alert("Payment verification failed. Please contact support.");
    });
}

// Share functionality
function shareCampaign(campaignId, title) {
  if (navigator.share) {
    navigator
      .share({
        title: `Support: ${title}`,
        text: `Help support this campaign on DonateKart`,
        url: `${window.location.origin}/campaign.html?id=${campaignId}`,
      })
      .catch((err) => {
        console.log("Error sharing:", err);
      });
  } else {
    // Fallback for browsers without Web Share API
    const url = `${window.location.origin}/campaign.html?id=${campaignId}`;
    prompt("Copy this link to share:", url);
  }
}


fetchCampaigns();

// Load Razorpay script dynamically
const razorpayScript = document.createElement("script");
razorpayScript.src = "https://checkout.razorpay.com/v1/checkout.js";
razorpayScript.async = true;
razorpayScript.onerror = () => {
  console.error("Failed to load Razorpay script");
};
document.body.appendChild(razorpayScript);
