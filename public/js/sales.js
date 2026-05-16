document.addEventListener('DOMContentLoaded', function() {
    if (!window.AuthUtils.checkAuth()) return;

    initSalesPage();
});

let products = [];
let cart = [];

function initSalesPage() {
    const searchInput = document.getElementById('productSearch');
    const searchBtn = document.getElementById('searchBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const confirmCheckoutBtn = document.getElementById('confirmCheckoutBtn');

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', window.AuthUtils.debounce(handleSearch, 200));
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch();
        }
    });

    checkoutBtn.addEventListener('click', openCheckoutModal);
    confirmCheckoutBtn.addEventListener('click', submitCheckout);

    loadProducts();
}

async function loadProducts() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/products/');
        products = await response.json();
        renderSearchResults(products);
    } catch (error) {
        console.error('Error loading products:', error);
        window.AuthUtils.showNotification('Unable to load products', 'danger');
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('productSearch').value.trim().toLowerCase();

    if (!searchTerm) {
        renderSearchResults(products);
        return;
    }

    const filtered = products.filter(product => {
        return product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm));
    });

    renderSearchResults(filtered);
}

function renderSearchResults(items) {
    const productResults = document.getElementById('productResults');

    if (!items || items.length === 0) {
        productResults.innerHTML = '<div class="col-12"><p class="text-muted text-center">No products found.</p></div>';
        return;
    }

    const html = items.map(product => {
        const isOutOfStock = product.stock <= 0;
        return `
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${product.name}</h6>
                            <span class="badge ${isOutOfStock ? 'bg-danger' : 'bg-success'}">
                                ${isOutOfStock ? 'Out of Stock' : `Stock ${product.stock}`}
                            </span>
                        </div>
                        <p class="card-text text-muted mb-2">${product.description || 'No description available'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${window.AuthUtils.formatCurrency(product.price)}</strong>
                                <div class="small text-muted">Available: ${product.stock}</div>
                            </div>
                            <div class="d-flex align-items-center">
                                <input type="number" min="1" max="${product.stock}" value="1" id="qty-${product._id}" class="form-control form-control-sm me-2" style="width:5rem;">
                                <button class="btn btn-sm btn-primary" ${isOutOfStock ? 'disabled' : ''} onclick="addToCart('${product._id}')">
                                    <i class="fas fa-cart-plus me-1"></i>Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    productResults.innerHTML = html;
}

function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    if (!product || product.stock <= 0) {
        window.AuthUtils.showNotification('Product is out of stock', 'danger');
        return;
    }

    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

    if (!quantity || quantity < 1) {
        window.AuthUtils.showNotification('Please enter a valid quantity', 'warning');
        return;
    }

    const availableQty = product.stock;
    const existing = cart.find(item => item.product === productId);
    const currentCartQty = existing ? existing.quantity : 0;

    if (currentCartQty + quantity > availableQty) {
        window.AuthUtils.showNotification(`Only ${availableQty - currentCartQty} more item(s) can be added`, 'warning');
        return;
    }

    if (existing) {
        existing.quantity += quantity;
        existing.total = existing.quantity * existing.price;
    } else {
        cart.push({
            product: product._id,
            productName: product.name,
            quantity,
            price: product.price,
            total: product.price * quantity,
            stock: product.stock
        });
    }

    renderCart();
    window.AuthUtils.showNotification(`${quantity} x ${product.name} added to cart`, 'success');
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartTotal = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-muted text-center">No items in cart</p>';
        cartTotal.textContent = '₱0.00';
        checkoutBtn.disabled = true;
        return;
    }

    const html = cart.map(item => `
        <div class="d-flex align-items-center justify-content-between mb-2 border-bottom pb-2">
            <div>
                <strong>${item.productName}</strong>
                <div class="small text-muted">Qty: ${item.quantity}</div>
            </div>
            <div class="text-end">
                <div>${window.AuthUtils.formatCurrency(item.total)}</div>
                <button class="btn btn-sm btn-link text-danger p-0 mt-1" onclick="removeFromCart('${item.product}')">Remove</button>
            </div>
        </div>
    `).join('');

    cartItems.innerHTML = html;
    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
    cartTotal.textContent = window.AuthUtils.formatCurrency(totalAmount);
    checkoutBtn.disabled = false;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product !== productId);
    renderCart();
}

function openCheckoutModal() {
    if (cart.length === 0) return;

    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const paymentMethod = document.getElementById('paymentMethod');

    const html = cart.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${item.productName}</strong>
                <div class="small text-muted">Qty: ${item.quantity}</div>
            </div>
            <div>${window.AuthUtils.formatCurrency(item.total)}</div>
        </div>
    `).join('');

    checkoutItems.innerHTML = html;
    checkoutTotal.textContent = window.AuthUtils.formatCurrency(cart.reduce((sum, item) => sum + item.total, 0));
    paymentMethod.value = 'cash';

    const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    modal.show();
}

async function submitCheckout() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const confirmButton = document.getElementById('confirmCheckoutBtn');

    if (cart.length === 0) return;

    const refreshed = await refreshProductStock();
    if (!refreshed) return;
    if (!validateCartStock()) return;

    confirmButton.disabled = true;
    confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';

    try {
        const response = await window.AuthUtils.apiRequest('/api/transactions/', {
            method: 'POST',
            body: JSON.stringify({
                items: cart.map(item => ({ product: item.product, quantity: item.quantity })),
                paymentMethod
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Checkout failed');
        }

        const transaction = await response.json();
        cart = [];
        renderCart();
        loadProducts();

        const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
        checkoutModal.hide();

        showReceipt(transaction);
        window.AuthUtils.showNotification('Checkout successful', 'success');
    } catch (error) {
        window.AuthUtils.showNotification(error.message, 'danger');
    } finally {
        confirmButton.disabled = false;
        confirmButton.innerHTML = '<i class="fas fa-check me-2"></i>Complete Sale';
    }
}

async function refreshProductStock() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/products/');
        if (!response.ok) {
            const error = await response.json();
            window.AuthUtils.showNotification(error.message || 'Unable to refresh product stock', 'danger');
            return false;
        }

        products = await response.json();
        return true;
    } catch (error) {
        window.AuthUtils.showNotification('Unable to refresh product stock', 'danger');
        return false;
    }
}

function validateCartStock() {
    for (const item of cart) {
        const product = products.find(p => p._id === item.product);
        if (!product) {
            window.AuthUtils.showNotification('Product not found in current stock list', 'danger');
            return false;
        }
        if (item.quantity > product.stock) {
            window.AuthUtils.showNotification(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 'danger');
            return false;
        }
    }
    return true;
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
