window.addEventListener("DOMContentLoaded", async () => {
  await loadMyCampaigns();
});

console.log('🚀 API Base URL set to:', window.APP_CONFIG.API_BASE_URL);

async function loadMyCampaigns() {
  try {
    const response = await axios.get("/api/my-campaigns", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const campaigns = response.data.campaigns;
    const container = document.getElementById("campaignsContainer");
    container.innerHTML = "";

    campaigns.forEach((campaign) => {
      const card = document.createElement("div");
      card.className = "campaign-card";
      card.innerHTML = `
                <h3>${campaign.campaignTitle}</h3>
                <p>Raised Amount: ₹${campaign.amountRaised}</p>
                <p>Goal Amount: ₹${campaign.goalAmount}</p>
                <p>Status: ${campaign.status}</p>
                <button onclick="showDetails(${campaign.id})">See Details</button>
            `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading campaigns:", error);
    alert("Failed to load your campaigns.");
  }
}

async function showDetails(campaignId) {
  try {
    const response = await axios.get(`/api/campaigns/${campaignId}/details`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const { payments, userDetails } = response.data;
    console.log("payments: ", payments);
    
    console.log("userDetails: ", userDetails);

    const paymentHistoryDiv = document.getElementById("paymentHistory");
    const impactReportDiv = document.getElementById("impactReport");

   
    paymentHistoryDiv.innerHTML = "<h4>Payment History</h4>";
    if (payments.length === 0) {
      paymentHistoryDiv.innerHTML += "<p>No payments yet.</p>";
    } else {
      payments.forEach((payment) => {
        const donorName =
          userDetails.find((user) => user.id === payment.userId)?.name ||
          "Unknown";

        let reportSection = "";

        if (payment.impactReportUrl) {
          
          reportSection = `
      <p><strong>Impact Report:</strong> <a href="${payment.impactReportUrl}" target="_blank">View PDF</a></p>
    `;
        } else {
          
          reportSection = `
      <form class="impactReportForm" data-campaign-id="${campaignId}" data-payment-id="${payment.id}">
        <input type="file" name="impactReportPdf" accept="application/pdf" required />
        <button type="submit">Submit Impact Report</button>
      </form>
    `;
        }

        paymentHistoryDiv.innerHTML += `
    <div>
      <p>Donor: ${donorName}</p>
      <p>Amount: ₹${payment.amount}</p>
      <p>Receipt: <a href="${payment.receiptUrl}" target="_blank">View Receipt</a></p>
      ${reportSection}
      <hr>
    </div>
  `;
      });
    }

    document.addEventListener("submit", async function (event) {
      if (event.target.matches(".impactReportForm")) {
        event.preventDefault();
        const form = event.target;
        const campaignId = form.getAttribute("data-campaign-id");
        const paymentId = form.getAttribute("data-payment-id");

        const formData = new FormData(form);

        try {
          await axios.put(
            `/api/campaigns/${campaignId}/payments/${paymentId}/impact-report`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          alert("Impact report submitted!");
          
          await showDetails(campaignId);
        } catch (error) {
          console.error("Error submitting impact report:", error);
          alert("Failed to submit impact report.");
        }
      }
    });

    // Show modal
    const modal = document.getElementById("detailsModal");
    modal.style.display = "block";

    // Close modal
    const closeBtn = document.querySelector(".modal .close");
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  } catch (error) {
    console.error("Error loading campaign details:", error);
    alert("Failed to load campaign details.");
  }
}
