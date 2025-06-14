let currentStep = 0;
const steps = document.querySelectorAll(".form-step");
const progressBar = document.getElementById("progressBar");

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
  fieldsDiv.innerHTML = ""; // clear previous fields

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
  }

  try {
    const response = await axios.get("/api/approved-ngos", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const ngoSelect = document.getElementById("ngoName");
    ngoSelect.innerHTML = '<option value="">Select an approved NGO</option>';
    console.log(response.data);
    response.data.approvedNgos.forEach((ngo) => {
      const option = document.createElement("option");
      option.value = ngo.name;
      option.textContent = ngo.name;
      ngoSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load NGOs:", error);
    const ngoSelect = document.getElementById("ngoName");
    ngoSelect.innerHTML = '<option value="">Failed to load NGOs</option>';
  }
}

// Final submission
document
  .getElementById("campaignForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    const form = document.getElementById("campaignForm");
    const formData = new FormData(form);

    try {
      const response = await axios.post("/api/start/campaigns", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert("Campaign submitted successfully!");
      localStorage.removeItem("campaignDraft");
      form.reset();
      currentStep = 0;
      showStep(currentStep);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit campaign. Please try again.");
    }
  });

// Load draft on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);
  loadDraft();
});
