const form = document.getElementById("logInForm");

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await axios.post(`${window.APP_CONFIG.API_BASE_URL}/api/login`, {
            email, 
            password
        });
        
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.name);
            alert('Login successful!');
            window.location.href = './home.html';
        }

    } catch (err) {
        console.error('Login error:', err);
        const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
        alert(errorMessage);
    }
});
