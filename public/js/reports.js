// Reports functionality
let salesChart = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!window.AuthUtils.checkAuth()) return;

    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    document.getElementById('salesStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('salesEndDate').value = endDate.toISOString().split('T')[0];

    // Event listeners
    document.getElementById('generateSalesReport').addEventListener('click', generateSalesReport);
    document.getElementById('generateInventoryReport').addEventListener('click', generateInventoryReport);
    document.getElementById('downloadSalesPDF').addEventListener('click', () => downloadReport('sales', 'pdf'));
    document.getElementById('downloadSalesExcel').addEventListener('click', () => downloadReport('sales', 'excel'));
    document.getElementById('downloadInventoryPDF').addEventListener('click', () => downloadReport('inventory', 'pdf'));
    document.getElementById('downloadInventoryExcel').addEventListener('click', () => downloadReport('inventory', 'excel'));
});

async function generateSalesReport() {
    const startDate = document.getElementById('salesStartDate').value;
    const endDate = document.getElementById('salesEndDate').value;

    if (!startDate || !endDate) {
        window.AuthUtils.showNotification('Please select both start and end dates', 'warning');
        return;
    }

    try {
        const response = await window.AuthUtils.apiRequest(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();

        displaySalesReport(data);
        createSalesReportChart(data);
    } catch (error) {
        console.error('Error generating sales report:', error);
        window.AuthUtils.showNotification('Error generating sales report', 'error');
    }
}

async function generateInventoryReport() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/reports/inventory');
        const data = await response.json();

        displayInventoryReport(data);
    } catch (error) {
        console.error('Error generating inventory report:', error);
        window.AuthUtils.showNotification('Error generating inventory report', 'error');
    }
}

function displaySalesReport(data) {
    const container = document.getElementById('reportContent');

    const html = `
        <div class="row">
            <div class="col-md-6">
                <h5>Sales Summary</h5>
                <p><strong>Period:</strong> ${window.AuthUtils.formatDate(data.period.start)} to ${window.AuthUtils.formatDate(data.period.end)}</p>
                <p><strong>Total Revenue:</strong> ${window.AuthUtils.formatCurrency(data.summary.totalRevenue)}</p>
                <p><strong>Total Transactions:</strong> ${data.summary.totalTransactions}</p>
                <p><strong>Average Transaction:</strong> ${window.AuthUtils.formatCurrency(data.summary.totalRevenue / Math.max(data.summary.totalTransactions, 1))}</p>
            </div>
            <div class="col-md-6">
                <h5>Daily Breakdown</h5>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Sales</th>
                                <th>Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.dailyData.map(day => `
                                <tr>
                                    <td>${window.AuthUtils.formatDate(day.date)}</td>
                                    <td>${window.AuthUtils.formatCurrency(day.totalSales)}</td>
                                    <td>${day.transactionCount}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function displayInventoryReport(data) {
    const container = document.getElementById('reportContent');

    const html = `
        <div class="row">
            <div class="col-md-6">
                <h5>Inventory Summary</h5>
                <p><strong>Total Products:</strong> ${data.summary.totalProducts}</p>
                <p><strong>Low Stock Items:</strong> ${data.summary.lowStockCount}</p>
                <p><strong>Out of Stock Items:</strong> ${data.summary.outOfStockCount}</p>
                <p><strong>Total Inventory Value:</strong> ${window.AuthUtils.formatCurrency(data.summary.totalValue)}</p>
                <p><strong>Estimated Profit:</strong> ${window.AuthUtils.formatCurrency(data.summary.estimatedProfit)}</p>
            </div>
            <div class="col-md-6">
                <h5>Stock Status</h5>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Stock</th>
                                <th>Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.products.map(product => `
                                <tr>
                                    <td>${product.name}</td>
                                    <td>${product.stock}</td>
                                    <td>${window.AuthUtils.formatCurrency(product.stock * product.price)}</td>
                                    <td>
                                        <span class="badge ${getStockStatusClass(product)}">
                                            ${getStockStatusText(product)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function createSalesReportChart(data) {
    const ctx = document.getElementById('salesReportChart').getContext('2d');

    // Destroy existing chart
    if (salesChart) {
        salesChart.destroy();
    }

    const labels = data.dailyData.map(day => window.AuthUtils.formatDate(day.date));
    const salesData = data.dailyData.map(day => day.totalSales);

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Sales',
                data: salesData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return window.AuthUtils.formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function downloadReport(type, format) {
    const startDate = document.getElementById('salesStartDate').value;
    const endDate = document.getElementById('salesEndDate').value;

    let url;
    if (type === 'sales') {
        if (!startDate || !endDate) {
            window.AuthUtils.showNotification('Please select dates for sales report', 'warning');
            return;
        }
        url = `/api/reports/${type}/${format}?startDate=${startDate}&endDate=${endDate}`;
    } else {
        url = `/api/reports/${type}/${format}`;
    }

    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getStockStatusClass(product) {
    if (product.stock === 0) return 'bg-danger';
    if (product.stock <= product.minStock) return 'bg-warning';
    return 'bg-success';
}

function getStockStatusText(product) {
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock <= product.minStock) return 'Low Stock';
    return 'In Stock';
}