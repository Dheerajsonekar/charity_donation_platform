const token = localStorage.getItem("token");

if (!token) {
  alert("You must be logged in to view this page.");
  window.location.href = "/login.html";
}

console.log('🚀 API Base URL set to:', window.APP_CONFIG.API_BASE_URL);

async function fetchDonations() {
  try {
    const res = await axios("/api/payments/user/donations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const donations = res.data;
    console.log(donations);

    const tbody = document.querySelector("#donationTable tbody");
    tbody.innerHTML = "";

    donations.forEach((donation, index) => {
      const receiptCell = document.createElement("td");
      if (donation.receiptUrl) {
        receiptCell.innerHTML = `<a href="${donation.receiptUrl}" target="_blank" class="btn">Download Receipt</a>`;
      } else {
        const btn = document.createElement("button");
        btn.textContent = "Generate Receipt";
        btn.onclick = async () => await generateReceipt(donation.id, receiptCell);
        receiptCell.appendChild(btn);
      }

      // ✅ Impact Report Cell
      const impactCell = document.createElement("td");
      if (donation.impactReportUrl) {
        impactCell.innerHTML = `
          <a href="${donation.impactReportUrl}" target="_blank" class="btn">View Report</a>
        `;
      } else {
        impactCell.textContent = "Not Available";
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${donation.Campaign.campaignTitle}</td>
        <td>₹${donation.amount}</td>
        <td>${new Date(donation.createdAt).toLocaleString()}</td>
      `;
      row.appendChild(receiptCell);
      row.appendChild(impactCell);

      tbody.appendChild(row);
    });
  } catch (error) {
    alert("Error loading donations");
    console.error(error);
  }
}


async function generateReceipt(donationId, cell) {
  try {
    const res = await axios(
      `/api/payments/user/donations/${donationId}/receipt`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = res.data;
    console.log(data);
    if (data.receiptUrl) {
      cell.innerHTML = `<a href="${data.receiptUrl}" target="_blank" class="btn">Download Receipt</a>`;
    } else {
      cell.textContent = "Receipt Not Available";
    }
  } catch (error) {
    alert("Failed to generate receipt");
    console.error(error);
  }
}

async function viewImpactReports(campaignId) {
  try {
    const res = await axios.get(`/api/campaigns/${campaignId}/impact-reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reports = res.data;

    if (reports.length === 0) {
      alert('No Impact Reports available yet.');
      return;
    }

    let reportList = 'Impact Reports:\n\n';
    reports.forEach((report, idx) => {
      reportList += `${idx + 1}. ${report.title}\n${report.content}\n`;
      if (report.mediaUrl) {
        reportList += `Media: ${report.mediaUrl}\n`;
      }
      reportList += '\n------------------\n\n';
    });

    alert(reportList); // Simple way, you can also show in a modal
  } catch (error) {
    console.error(error);
    alert('Failed to load impact reports.');
  }
}


fetchDonations();
