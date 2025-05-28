const logoutbtn = document.getElementById("logoutbtn");
const token = localStorage.getItem("token");
if(!token){
    window.location.href = "./login.html";
}

const username = localStorage.getItem("username");

logoutbtn.addEventListener("click", ()=>{
    localStorage.clear();
    window.location.href = "./login.html";
})