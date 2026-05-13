// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    if (!window.AuthUtils.checkAuth()) return;

    loadDashboardData();
    loadRestockSuggestions();
    loadLowStockProducts();
});

async function loadDashboardData() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/dashboard/');
        const data = await response.json();

        // Update metrics
        document.getElementById('dailySales').textContent = window.AuthUtils.formatCurrency(data.dailySales.total);
        document.getElementById('totalProducts').textContent = data.totalProducts;
        document.getElementById('lowStockAlerts').textContent = data.lowStockAlerts;
        document.getElementById('todayTransactions').textContent = data.dailySales.count;

        // Update top products
        updateTopProducts(data.topSellingProducts);

        // Create sales chart
        createSalesChart(data.topSellingProducts);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        window.AuthUtils.showNotification('Error loading dashboard data', 'error');
    }
}

function updateTopProducts(products) {
    const container = document.getElementById('topProducts');

    if (products.length === 0) {
        container.innerHTML = '<p class="text-muted">No sales data available</p>';
        return;
    }

    const html = products.map(product => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>${product.name}</span>
            <span class="badge bg-primary">${product.totalSold} sold</span>
        </div>
    `).join('');

    container.innerHTML = html;
}

function createSalesChart(products) {
    const ctx = document.getElementById('salesChart').getContext('2d');

    const labels = products.map(p => p.name);
    const data = products.map(p => p.totalSold);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Units Sold (Last 30 days)',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function loadRestockSuggestions() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/dashboard/restock-suggestions');
        const suggestions = await response.json();

        const container = document.getElementById('restockSuggestions');

        if (suggestions.length === 0) {
            container.innerHTML = '<p class="text-muted">No restock suggestions at this time</p>';
            return;
        }

        const html = suggestions.slice(0, 5).map(suggestion => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <div>
                    <strong>${suggestion.name}</strong><br>
                    <small class="text-muted">
                        Current: ${suggestion.currentStock} | 
                        Suggested: ${suggestion.suggestedQuantity}
                    </small>
                </div>
                <span class="badge bg-${suggestion.priority === 'high' ? 'danger' : 'warning'}">
                    ${suggestion.priority}
                </span>
            </div>
        `).join('');

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading restock suggestions:', error);
    }
}

async function loadLowStockProducts() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/products/low-stock');
        const products = await response.json();

        const container = document.getElementById('lowStockProducts');

        if (products.length === 0) {
            container.innerHTML = '<p class="text-muted">All products are well-stocked</p>';
            return;
        }

        const html = products.slice(0, 5).map(product => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${product.name}</span>
                <span class="badge bg-warning">${product.stock} left</span>
            </div>
        `).join('');

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading low stock products:', error);
    }
}