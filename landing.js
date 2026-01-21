// Landing Page JavaScript
class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupModalHandlers();
        this.setupFormHandlers();
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.setupButtonHandlers();
    }

    // Button Handlers
    setupButtonHandlers() {
        // Learn More button - scroll to features
        document.getElementById('learnMoreBtn')?.addEventListener('click', () => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        });

        // About Signup button
        document.getElementById('aboutSignup')?.addEventListener('click', () => {
            const signupModal = document.getElementById('signupModal');
            this.openModal(signupModal);
        });
    }

    // Modal Handlers
    setupModalHandlers() {
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');

        // Open Login Modal
        document.getElementById('openLogin')?.addEventListener('click', () => {
            this.openModal(loginModal);
        });

        // Open Signup Modal
        document.getElementById('openSignup')?.addEventListener('click', () => {
            this.openModal(signupModal);
        });

        document.getElementById('heroSignup')?.addEventListener('click', () => {
            this.openModal(signupModal);
        });

        // Close Login Modal
        document.getElementById('closeLogin')?.addEventListener('click', () => {
            this.closeModal(loginModal);
        });

        // Close Signup Modal
        document.getElementById('closeSignup')?.addEventListener('click', () => {
            this.closeModal(signupModal);
        });

        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                this.closeModal(e.target.parentElement);
            });
        });

        // Switch between modals
        document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal(loginModal);
            this.openModal(signupModal);
        });

        document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal(signupModal);
            this.openModal(loginModal);
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(loginModal);
                this.closeModal(signupModal);
            }
        });
    }

    openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Form Handlers
    setupFormHandlers() {
        // Login Form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Signup Form
        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Contact Form
        document.querySelector('.contact-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContact(e);
        });
    }

    handleLogin() {
        const countryCode = document.getElementById('loginCountryCode').value;
        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;

        // Get currency info
        const selectedOption = document.getElementById('loginCountryCode').selectedOptions[0];
        const currency = selectedOption.dataset.currency;
        const currencySymbol = selectedOption.dataset.symbol;

        // Validate
        if (!phone || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

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

            this.showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            this.showNotification('Invalid credentials. Please try again.', 'error');
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
        if (!name || !email || !phone || !password || !confirmPassword) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match!', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
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
            this.showNotification('User already exists!', 'error');
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

        this.showNotification('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    handleContact(e) {
        const formData = new FormData(e.target);
        this.showNotification('Thank you! We will get back to you soon.', 'success');
        e.target.reset();
    }

    // Mobile Menu
    setupMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const menu = document.querySelector('.nav-menu');

        toggle?.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    }

    // Smooth Scroll
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };

        notification.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: ${colors[type]};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-family: 'Times New Roman', Times, serif;
            font-weight: 600;
            font-size: 16px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new LandingPage();

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.12)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
        }
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .pricing-card, .about-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
});
