const token = localStorage.getItem("token");
const profileContainer = document.getElementById("profileContainer");
const dropdownMenu = document.getElementById("dropdownMenu");
const loginBtn = document.getElementById("loginBtn");

if (token) {
  // Show profile
  loginBtn.style.display = "none";
  profileContainer.style.display = "block";

  axios
    .get("/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      // You can dynamically change profilePic if user has a URL
      // e.g., document.getElementById("profilePic").style.backgroundImage = `url(${res.data.avatar})`;
    })
    .catch((err) => {
      console.error(err);
      localStorage.removeItem("token");
      loginBtn.style.display = "block";
      profileContainer.style.display = "none";
    });
}

// Toggle dropdown
profileContainer.addEventListener("click", () => {
  dropdownMenu.style.display =
    dropdownMenu.style.display === "block" ? "none" : "block";
});

window.addEventListener("click", (e) => {
  if (!profileContainer.contains(e.target)) {
    dropdownMenu.style.display = "none";
  }
});

// Logout
document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  loginBtn.style.display = "block";
  profileContainer.style.display = "none";
});

// Login button redirect
loginBtn.addEventListener("click", () => {
  window.location.href = "/login.html";
});



 const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");
 const authsection = document.querySelector(".auth-section");

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("show");
    authsection.classList.toggle("show");
  });

  // Close hamburger menu on outside click
window.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target) && !authsection.contains(e.target)) {
    navLinks.classList.remove("show");
    authsection.classList.remove("show");
  }
});
