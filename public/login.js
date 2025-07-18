const form = document.getElementById("logInForm");

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : window.location.origin;

    try {
        const response = await axios.post(`${API_BASE_URL}/api/login`, {
            email, 
            password
        });
        
        if (response.data.success !== false) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.name);
            window.location.href = './home.html';
        }

    } catch (err) {
        console.error('Login error:', err);
        const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
        alert(errorMessage);
    }
});