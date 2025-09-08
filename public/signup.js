const signupForm = document.getElementById('registerForm');

console.log('🚀 API Base URL set to:', window.APP_CONFIG.API_BASE_URL);

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value
    };

    const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : window.location.origin;

    try {
        const response = await axios.post(`${API_BASE_URL}/api/register`, user);
        
        alert('Registration successful! Please login to continue.');
        signupForm.reset();
        window.location.href = './login.html';
        
    } catch (err) {
        console.error('Registration error:', err);
        const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
        alert(errorMessage);
    }
});