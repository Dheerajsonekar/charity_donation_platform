const form = document.getElementById('registerForm');

form.addEventListener('submit', async (e)=>{
 e.preventDefault();
 const user = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    password: document.getElementById('password').value
 }

 try{
     await axios.post('http://localhost:3000/api/register', user);
    
    console.log("user registered successfully");
    form.reset();

    window.location.href = './login.html';
 }catch(err){
    console.error(err);
 }
})