let currentStep = 0;
const steps = document.querySelectorAll(".form-step");
const progressBar = document.getElementById("progressBar");

console.log("url",window.APP_CONFIG);

function showStep(index) {
  steps.forEach((step, i) => {
    step.classList.toggle("active", i === index);
  });
  progressBar.style.width = ((index + 1) / steps.length) * 100 + "%";
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
}

function validateStep(index) {
  const step = steps[index];
  const requiredFields = step.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );

  for (let field of requiredFields) {
    if (!field.value.trim()) {
      alert("Please fill all required fields.");
      field.focus();
      return false;
    }
  }
  return true;
}

function saveDraft() {
  const formData = {
    campaignerName: document.getElementById("campaignerName")?.value || "",
    campaignerEmail: document.getElementById("campaignerEmail")?.value || "",
    campaignerPhone: document.getElementById("campaignerPhone")?.value || "",
    beneficiaryType: document.getElementById("beneficiaryType")?.value || "",
    campaignTitle: document.getElementById("campaignTitle")?.value || "",
    goalAmount: document.getElementById("goalAmount")?.value || "",
    campaignDescription:
      document.getElementById("campaignDescription")?.value || "",
    // Add more fields if needed
  };

  localStorage.setItem("campaignDraft", JSON.stringify(formData));
  alert("Draft saved!");
}

function loadDraft() {
  const draft = localStorage.getItem("campaignDraft");
  if (draft) {
    const data = JSON.parse(draft);
    for (let key in data) {
      const input = document.getElementById(key);
      if (input) input.value = data[key];
    }

    // If beneficiary type was set, show the dynamic fields again
    const type = data.beneficiaryType;
    if (type) {
      document.getElementById("beneficiaryType").value = type;
      showBeneficiaryFields(); // dynamically injects fields
    }
  }
}

async function showBeneficiaryFields() {
  const type = document.getElementById("beneficiaryType").value;
  const fieldsDiv = document.getElementById("beneficiaryFields");
  fieldsDiv.innerHTML = "";

  if (type === "individual") {
    fieldsDiv.innerHTML = `
      <input type="text" id="beneficiaryName" name="beneficiaryName" placeholder="Your Name" required />
      <input type="email" id="beneficiaryEmail" name="beneficiaryEmail" placeholder="Your Email" required />
      <input type="tel" id="beneficiaryPhone" name="beneficiaryPhone" placeholder="Your Phone Number" required />
    `;
  } else if (type === "other-individual") {
    fieldsDiv.innerHTML = `
      <input type="text" id="beneficiaryName" name="beneficiaryName" placeholder="Beneficiary Name" required />
      <input type="email" id="beneficiaryEmail" name="beneficiaryEmail" placeholder="Beneficiary Email" required />
      <input type="tel" id="beneficiaryPhone" name="beneficiaryPhone" placeholder="Beneficiary Phone Number" required />
    `;
  } else if (type === "ngo") {
    fieldsDiv.innerHTML = `
      <label for="ngoName">Select Approved NGO:</label>
      <select id="ngoName" name="ngoName" required>
        <option value="">Loading NGOs...</option>
      </select>
      <input type="text" id="ngoState" name="ngoState" placeholder="State" required />
      <input type="text" id="ngoCity" name="ngoCity" placeholder="City" required />
    `;

    try {
      const response = await axios.get(`${window.APP_CONFIG.API_BASE_URL}/api/approved-ngos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const ngoSelect = document.getElementById("ngoName");
      ngoSelect.innerHTML = '<option value="">Select an approved NGO</option>';
      
      if (response.data.approvedNgos && response.data.approvedNgos.length > 0) {
        response.data.approvedNgos.forEach((ngo) => {
          const option = document.createElement("option");
          option.value = ngo.name;
          option.textContent = ngo.name;
          ngoSelect.appendChild(option);
        });
      } else {
        ngoSelect.innerHTML = '<option value="">No approved NGOs available</option>';
      }
    } catch (error) {
      console.error("Failed to load NGOs:", error);
      const ngoSelect = document.getElementById("ngoName");
      ngoSelect.innerHTML = '<option value="">Failed to load NGOs</option>';
    }
  }
}


document.getElementById("campaignForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateStep(currentStep)) return;

  const form = document.getElementById("campaignForm");
  const formData = new FormData(form);

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  try {
    const response = await axios.post(`/api/start/campaigns`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        'Content-Type': 'multipart/form-data'
      },
    });

    if (response.data.success) {
      alert("Campaign submitted successfully! It will be reviewed within 24-48 hours. You'll receive an email confirmation shortly.");
      localStorage.removeItem("campaignDraft");
      form.reset();
      currentStep = 0;
      showStep(currentStep);
      
      // Redirect to campaigns page
      setTimeout(() => {
        window.location.href = '/my-campaign.html';
      }, 1500);
    } else {
      throw new Error(response.data.message || 'Submission failed');
    }
    
  } catch (error) {
    console.error("Submission failed:", error);
    const errorMessage = error.response?.data?.message || "Failed to submit campaign. Please try again.";
    alert(errorMessage);
  } finally {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});


window.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);
  loadDraft();
});
