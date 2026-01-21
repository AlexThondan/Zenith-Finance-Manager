// Authentication Logic
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Form switching
        document.getElementById('showSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Form submissions
        document.getElementById('loginFormSubmit')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupFormSubmit')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
    }

    showSignupForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    }

    showLoginForm() {
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    }

    handleLogin() {
        const countryCode = document.getElementById('loginCountryCode').value;
        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;

        // Get currency info
        const selectedOption = document.getElementById('loginCountryCode').selectedOptions[0];
        const currency = selectedOption.dataset.currency;
        const currencySymbol = selectedOption.dataset.symbol;

        // Get stored users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.phone === countryCode + phone && u.password === password);

        if (user) {
            // Store session
            localStorage.setItem('currentUser', JSON.stringify({
                ...user,
                currency,
                currencySymbol
            }));

            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid credentials. Please try again or sign up.');
        }
    }

    handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const countryCode = document.getElementById('signupCountryCode').value;
        const phone = document.getElementById('signupPhone').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        // Validation
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        // Get currency info
        const selectedOption = document.getElementById('signupCountryCode').selectedOptions[0];
        const currency = selectedOption.dataset.currency;
        const currencySymbol = selectedOption.dataset.symbol;

        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Check if user already exists
        const fullPhone = countryCode + phone;
        if (users.some(u => u.phone === fullPhone || u.email === email)) {
            alert('User with this phone number or email already exists!');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            phone: fullPhone,
            countryCode,
            password,
            currency,
            currencySymbol,
            createdAt: new Date().toISOString()
        };

        // Save user
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Auto login
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        // Show success and redirect
        alert('Account created successfully!');
        window.location.href = 'dashboard.html';
    }

    checkAuth() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser && window.location.pathname.includes('dashboard.html')) {
            // User is logged in and on dashboard - OK
            return;
        } else if (currentUser && !window.location.pathname.includes('dashboard.html')) {
            // User is logged in but on login page - redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
