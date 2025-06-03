const token = localStorage.getItem("token");
(async function fetchUserProfile() {
  try {
    const response = await axios.get("/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = response.data;
    console.log(user);
    document.getElementById("name").textContent = user.name || "N/A";
    document.getElementById("email").textContent = user.email || "N/A";
    document.getElementById("phone").textContent = user.phone || "N/A";
    document.getElementById("accountType").textContent = user.isAdmin
      ? "Admin"
      : "User";
  } catch (err) {
    console.error(err);
    alert("You must be logged in to view this page.");
    localStorage.clear();
    window.location.href = "/login.html";
  }
})();

document.getElementById("editBtn").addEventListener("click", () => {
  document.getElementById("editForm").style.display = "block";
  document.getElementById('editBtn').style.display = 'none';
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  document.getElementById("editForm").style.display = "none";
  document.getElementById('editBtn').style.display = 'block';
});

document.getElementById("saveBtn").addEventListener("click", async () => {
    const newName = document.getElementById("editName").value;
    const newPhone = document.getElementById("editPhone").value;

    try {
      await axios.put("/api/user/update", {
        name: newName,
        phone: newPhone,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      alert("Profile updated successfully!");
      location.reload(); 
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  });