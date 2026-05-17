// Authentication utilities
const API_BASE = '/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        window.location.href = '/';
        return false;
    }

    // Update user name in navbar
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }

    loadLowStockIndicator();

    return true;
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard';
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        throw error;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Load low stock count and update the product nav badge
async function loadLowStockIndicator() {
    const badge = document.getElementById('productsLowStockBadge');
    if (!badge) return;

    try {
        const response = await apiRequest('/api/products/low-stock');
        if (!response || !response.ok) {
            return;
        }

        const products = await response.json();
        const count = Array.isArray(products) ? products.length : 0;

        if (count > 0) {
            badge.textContent = count;
            badge.title = `${count} out-of-stock / low-stock product(s)`;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
            badge.removeAttribute('title');
        }
    } catch (error) {
        console.error('Failed to load low stock indicator', error);
    }
}

// API request wrapper with auth
async function apiRequest(url, options = {}) {
    const headers = getAuthHeaders();

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });

    if (response.status === 401) {
        logout();
        return;
    }

    return response;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show notification`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format date time
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
            };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other scripts
window.AuthUtils = {
    checkAuth,
    login,
    logout,
    getAuthHeaders,
    apiRequest,
    loadLowStockIndicator,
    showNotification,
    formatCurrency,
    formatDate,
    formatDateTime,
    debounce
};

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const alertContainer = document.getElementById('alert-container');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showAlert('Please enter both username and password', 'danger');
                return;
            }

            // Disable button and show loading
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging in...';

            try {
                await login(username, password);
            } catch (error) {
                showAlert(error.message, 'danger');
            } finally {
                // Re-enable button
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
            }
        });
    }
});

// Show alert function for login page
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
}