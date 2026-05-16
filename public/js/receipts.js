document.addEventListener('DOMContentLoaded', function() {
    if (!window.AuthUtils.checkAuth()) return;
    loadReceipts();
});

async function loadReceipts() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/transactions/?limit=100');
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Unable to load receipts');
        }

        const transactions = await response.json();
        renderReceipts(transactions);
    } catch (error) {
        window.AuthUtils.showNotification(error.message, 'danger');
        const tbody = document.getElementById('receiptTableBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Unable to load receipts.</td></tr>';
    }
}

function renderReceipts(transactions) {
    const tbody = document.getElementById('receiptTableBody');

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No receipts available.</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.createdAt).toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <tr>
                <td>${transaction.transactionId}</td>
                <td>${date}</td>
                <td>${transaction.cashier?.name || 'N/A'}</td>
                <td>${transaction.items.length}</td>
                <td>${window.AuthUtils.formatCurrency(transaction.totalAmount)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary" onclick="viewReceipt('${transaction._id}')">
                        <i class="fas fa-eye me-1"></i>View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewReceipt(transactionId) {
    try {
        const response = await window.AuthUtils.apiRequest(`/api/transactions/${transactionId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Unable to load receipt');
        }

        const transaction = await response.json();
        showReceipt(transaction);
    } catch (error) {
        window.AuthUtils.showNotification(error.message, 'danger');
    }
}

function showReceipt(transaction) {
    const receiptContent = document.getElementById('receiptContent');
    const receiptTotal = window.AuthUtils.formatCurrency(transaction.totalAmount);
    const createdAt = new Date(transaction.createdAt).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemsHtml = transaction.items.map(item => `
        <div class="d-flex justify-content-between mb-2">
            <div>
                <strong>${item.productName}</strong><br>
                <span class="small text-muted">Qty: ${item.quantity} x ${window.AuthUtils.formatCurrency(item.price)}</span>
            </div>
            <div>${window.AuthUtils.formatCurrency(item.total)}</div>
        </div>
    `).join('');

    receiptContent.innerHTML = `
        <div class="mb-3">
            <strong>Transaction ID:</strong> ${transaction.transactionId}<br>
            <strong>Date:</strong> ${createdAt}<br>
            <strong>Cashier:</strong> ${transaction.cashier?.name || 'N/A'}<br>
            <strong>Payment:</strong> ${transaction.paymentMethod}
        </div>
        <div>${itemsHtml}</div>
        <hr>
        <div class="d-flex justify-content-between">
            <strong>Total Paid:</strong>
            <strong>${receiptTotal}</strong>
        </div>
    `;

    const receiptModal = new bootstrap.Modal(document.getElementById('receiptModal'));
    receiptModal.show();
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { font-size: 18px; margin-bottom: 10px; }
                    .receipt-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .receipt-footer { margin-top: 20px; display: flex; justify-content: space-between; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>StoreWise POS Receipt</h1>
                ${receiptContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

window.printReceipt = printReceipt;
