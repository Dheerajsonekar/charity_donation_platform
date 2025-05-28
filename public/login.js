const form = document.getElementById("logInForm");

form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;


    try{
      const response = await axios.post('http://localhost:3000/api/login', {email, password});
      
      if(response.status === 200){
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.name);
        window.location.href = './home.html'
      }

    }catch(err){
        console.log(err);
    }
})