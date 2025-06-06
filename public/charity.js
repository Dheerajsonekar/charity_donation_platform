document.getElementById("addCharityBtn").addEventListener("click", () => {
  document.querySelector("#addCharityForm").style.display = "block";
  document.getElementById("addCharityBtn").style.display = "none";
});

document.getElementById("cancelAddCharityBtn").addEventListener("click", () => {
  document.querySelector("#addCharityForm").style.display = "none";
  document.getElementById("addCharityBtn").style.display = "block";
});

const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    registrationNumber: document.getElementById("registrationNumber").value,
    name: document.getElementById("charityName").value,
    description: document.getElementById("charityDescription").value,
    website: document.getElementById("charityWebsite").value,
  };

  try {
    const response = await axios.post("/api/addcharity", data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (response.status === 200) {
      alert("Charity added successfully");
      window.location.href = "/charity.html";
    }
  } catch (err) {
    console.error("Error:", err);
  }
})



async function fetchCharities() {
  try {
    const response = await axios.get("/api/getcharities", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const charities = response.data.charities;
    const charityDiv = document.getElementById("charityDetails");
    charityDiv.innerHTML = "";
    if (charities.length === 0) {
      charityDiv.innerHTML = "<p>No charities found for this user</p>";
      return;
    }

    charities.forEach((charity) => {
      const charityCard = document.createElement("div");
      charityCard.className = "charity-card";
      charityCard.innerHTML = `
                <h3>${charity.name}</h3>
                <p><strong>Registration Number:</strong> ${charity.registrationNumber}</p>
               
                <p><strong>Description:</strong> ${charity.description}</p>
                <p><strong>Website:</strong> <a href="${charity.website}" target="_blank">${charity.website}</a></p>
                 <p><strong>Status:</strong> ${charity.status}</p>
            `;
      charityDiv.appendChild(charityCard);
    });
  } catch (err) {
    console.error("Error fetching charities: ", err);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  fetchCharities();
});
