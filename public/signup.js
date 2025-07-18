const signupForm = document.getElementById('registerForm');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value
    };

    // Basic validation
    if (!user.name || !user.email || !user.phone || !user.password) {
        alert('Please fill in all fields');
        return;
    }

    if (user.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        const response = await axios.post(`${window.APP_CONFIG.API_BASE_URL}/api/register`, user);
        
        if (response.data.success) {
            alert('Registration successful! Please login to continue.');
            signupForm.reset();
            window.location.href = './login.html';
        }
        
    } catch (err) {
        console.error('Registration error:', err);
        const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
        alert(errorMessage);
    }
});
