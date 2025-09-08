const token = localStorage.getItem("token");
const profileContainer = document.getElementById("profileContainer");
const dropdownMenu = document.getElementById("dropdownMenu");
const loginBtn = document.getElementById("loginBtn");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resetButton = document.getElementById("resetButton");
const campaignList = document.getElementById("campaignList");

// Use the API base URL from config
const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : window.location.origin;

console.log('🚀 API Base URL set to:', window.APP_CONFIG.API_BASE_URL);

// Authentication UI
if (token) {
  loginBtn.style.display = "none";
  profileContainer.style.display = "block";

  axios
    .get(`${API_BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      console.log("User profile data:", res.data);
      if (res.data.user && res.data.user.avatar) {
        document.getElementById("profilePic").style.backgroundImage = `url(${res.data.user.avatar})`;
      }
    })
    .catch((err) => {
      console.error('Profile fetch error:', err);
      localStorage.removeItem("token");
      loginBtn.style.display = "block";
      profileContainer.style.display = "none";
    });
}

// Navigation handlers
if (profileContainer) {
  profileContainer.addEventListener("click", () => {
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });
}

if (document.getElementById("logout")) {
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = "/login.html";
  });
}

// Mobile menu
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");
const authsection = document.querySelector(".auth-section");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("show");
    authsection.classList.toggle("show");
  });
}

window.addEventListener("click", (e) => {
  if (
    hamburger && navLinks && authsection &&
    !hamburger.contains(e.target) &&
    !navLinks.contains(e.target) &&
    !authsection.contains(e.target)
  ) {
    navLinks.classList.remove("show");
    authsection.classList.remove("show");
  }
  if (profileContainer && dropdownMenu && !profileContainer.contains(e.target)) {
    dropdownMenu.style.display = "none";
  }
});

// Campaign functions
async function fetchCampaigns(searchTerm = "") {
  try {
    console.log('Fetching campaigns from:', `${API_BASE_URL}/api/campaigns`);
    const response = await axios.get(
      `${API_BASE_URL}/api/campaigns?search=${encodeURIComponent(searchTerm)}`
    );
    
    if (response.data.success !== false) {
      displayCampaigns(response.data.campaigns || []);
    } else {
      throw new Error(response.data.message || 'Failed to fetch campaigns');
    }
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    if (campaignList) {
      campaignList.innerHTML = '<p class="error">Error loading campaigns. Please try again later.</p>';
    }
  }
}

function displayCampaigns(campaigns) {
  if (!campaignList) return;
  
  campaignList.innerHTML = "";

  if (!campaigns || campaigns.length === 0) {
    campaignList.innerHTML = '<p class="no-results">No campaigns found. Try a different search term.</p>';
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
      }" alt="${campaign.campaignTitle}" class="campaign-image" onerror="this.src='/placeholder-image.jpg'">
      <h3>${campaign.campaignTitle.substring(0, 40)}${campaign.campaignTitle.length > 40 ? '...' : ''}</h3>
      <p class="description">${campaign.campaignDescription.substring(0, 50)}...</p>
      <p class="organizer">By: ${campaign.campaignerName || campaign.User?.name || 'Anonymous'}</p>
      
      <div class="progress-container">
        <div class="progress-bar" style="width: ${progressPercent}%"></div>
      </div>
      <div class="progress-text">
        <span>₹${campaign.amountRaised || 0} raised</span>
        <span>${progressPercent}% of ₹${campaign.goalAmount}</span>
      </div>
      
      <div class="campaign-buttons">
        <button class="share-btn" onclick="shareCampaign('${campaign.id}', '${campaign.campaignTitle.replace(/'/g, "\\'")}')">
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
if (searchButton) {
  searchButton.addEventListener("click", () => {
    fetchCampaigns(searchInput.value);
  });
}

if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      fetchCampaigns(searchInput.value);
    }
  });
}

if (resetButton) {
  resetButton.addEventListener("click", () => {
    searchInput.value = "";
    fetchCampaigns();
  });
}

// Razorpay integration
function initiateDonation(campaignId) {
  if (!token) {
    alert("Please login to donate");
    window.location.href = "/login.html";
    return;
  }

  const amount = prompt("Enter donation amount (INR):");
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    alert("Please enter a valid amount greater than 0");
    return;
  }

  // Show loading state
  const donateButtons = document.querySelectorAll('.donate-btn');
  donateButtons.forEach(btn => {
    btn.textContent = 'Processing...';
    btn.disabled = true;
  });

  axios
    .post(`${API_BASE_URL}/api/payments/create-order`, {
      campaignId,
      amount: parseFloat(amount), 
    }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      if (!response.data.razorpayKeyId) {
        throw new Error('Payment configuration error');
      }

      const options = {
        key: response.data.razorpayKeyId, 
        amount: response.data.amount,
        currency: "INR",
        name: "DonateKart",
        description: `Donation for Campaign`,
        order_id: response.data.id,
        handler: function (paymentResponse) {
          verifyPayment(paymentResponse, campaignId, amount);
        },
        prefill: {
          name: response.data.user.name,
          email: response.data.user.email,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function() {
            // Reset button states
            donateButtons.forEach(btn => {
              btn.textContent = '❤ Donate';
              btn.disabled = false;
            });
          }
        }
      };

      if (typeof Razorpay !== 'undefined') {
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay not loaded');
      }
    })
    .catch((error) => {
      console.error("Payment error:", error);
      const errorMessage = error.response?.data?.message || "Error initiating payment. Please try again.";
      alert(errorMessage);
      
      // Reset button states
      donateButtons.forEach(btn => {
        btn.textContent = '❤ Donate';
        btn.disabled = false;
      });
    });
}

function verifyPayment(paymentResponse, campaignId, amount) {
  axios
    .post(`${API_BASE_URL}/api/payments/verify`, {
      paymentResponse,
      campaignId,
      amount,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      if (response.data.success) {
        alert("Payment successful! Thank you for your donation. You'll receive an email confirmation shortly.");
        fetchCampaigns(); // Refresh campaigns to show updated amounts
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    })
    .catch((error) => {
      console.error("Payment verification failed:", error);
      alert("Payment verification failed. Please contact support with your payment details.");
    })
    .finally(() => {
      // Reset button states
      const donateButtons = document.querySelectorAll('.donate-btn');
      donateButtons.forEach(btn => {
        btn.textContent = '❤ Donate';
        btn.disabled = false;
      });
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

// Initialize the page
fetchCampaigns();

// Load Razorpay script dynamically
const razorpayScript = document.createElement("script");
razorpayScript.src = "https://checkout.razorpay.com/v1/checkout.js";
razorpayScript.async = true;
razorpayScript.onerror = () => {
  console.error("Failed to load Razorpay script");
};
document.body.appendChild(razorpayScript);