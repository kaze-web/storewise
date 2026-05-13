// Product management functionality
let products = [];
let categories = new Set();

document.addEventListener('DOMContentLoaded', function() {
    if (!window.AuthUtils.checkAuth()) return;

    loadProducts();

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', window.AuthUtils.debounce(filterProducts, 300));
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    document.getElementById('lowStockFilter').addEventListener('change', filterProducts);
    document.getElementById('saveProductBtn').addEventListener('click', saveProduct);
    document.getElementById('updateProductBtn').addEventListener('click', updateProduct);
});

async function loadProducts() {
    try {
        const response = await window.AuthUtils.apiRequest('/api/products/');
        products = await response.json();

        // Extract categories
        categories = new Set(products.map(p => p.category).filter(c => c));
        updateCategoryFilter();

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        window.AuthUtils.showNotification('Error loading products', 'error');
    }
}

function updateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    select.innerHTML = '<option value="">All Categories</option>';

    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

function displayProducts(productsToShow) {
    const tbody = document.getElementById('productsTableBody');

    if (productsToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        return;
    }

    const html = productsToShow.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.stock}</td>
            <td>${window.AuthUtils.formatCurrency(product.price)}</td>
            <td>${product.category || '-'}</td>
            <td>
                <span class="status-badge ${getStockStatusClass(product)}">
                    ${getStockStatusText(product)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct('${product._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product._id}', '${product.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = html;
}

function getStockStatusClass(product) {
    if (product.stock === 0) return 'status-out-of-stock';
    if (product.stock <= product.minStock) return 'status-low-stock';
    return 'status-in-stock';
}

function getStockStatusText(product) {
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock <= product.minStock) return 'Low Stock';
    return 'In Stock';
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const lowStockOnly = document.getElementById('lowStockFilter').checked;

    let filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            (product.description && product.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesLowStock = !lowStockOnly || product.stock <= product.minStock;

        return matchesSearch && matchesCategory && matchesLowStock;
    });

    displayProducts(filtered);
}

async function saveProduct() {
    const formData = getProductFormData();

    if (!validateProductData(formData)) return;

    try {
        const response = await window.AuthUtils.apiRequest('/api/products/', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            document.getElementById('addProductForm').reset();
            loadProducts();
            window.AuthUtils.showNotification('Product added successfully', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        window.AuthUtils.showNotification(error.message, 'error');
    }
}

async function updateProduct() {
    const productId = document.getElementById('editProductId').value;
    const formData = getEditProductFormData();

    if (!validateProductData(formData)) return;

    try {
        const response = await window.AuthUtils.apiRequest(`/api/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
            loadProducts();
            window.AuthUtils.showNotification('Product updated successfully', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        window.AuthUtils.showNotification(error.message, 'error');
    }
}

async function deleteProduct(productId, productName) {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
        const response = await window.AuthUtils.apiRequest(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadProducts();
            window.AuthUtils.showNotification('Product deleted successfully', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        window.AuthUtils.showNotification(error.message, 'error');
    }
}

function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    // Fill edit form
    document.getElementById('editProductId').value = product._id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductCost').value = product.cost || '';
    document.getElementById('editProductStock').value = product.stock;
    document.getElementById('editProductMinStock').value = product.minStock;
    document.getElementById('editProductCategory').value = product.category || '';
    document.getElementById('editProductBarcode').value = product.barcode || '';

    // Show modal
    new bootstrap.Modal(document.getElementById('editProductModal')).show();
}

function getProductFormData() {
    return {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        cost: parseFloat(document.getElementById('productCost').value) || 0,
        stock: parseInt(document.getElementById('productStock').value),
        minStock: parseInt(document.getElementById('productMinStock').value) || 5,
        category: document.getElementById('productCategory').value.trim(),
        barcode: document.getElementById('productBarcode').value.trim()
    };
}

function getEditProductFormData() {
    return {
        name: document.getElementById('editProductName').value.trim(),
        description: document.getElementById('editProductDescription').value.trim(),
        price: parseFloat(document.getElementById('editProductPrice').value),
        cost: parseFloat(document.getElementById('editProductCost').value) || 0,
        stock: parseInt(document.getElementById('editProductStock').value),
        minStock: parseInt(document.getElementById('editProductMinStock').value) || 5,
        category: document.getElementById('editProductCategory').value.trim(),
        barcode: document.getElementById('editProductBarcode').value.trim()
    };
}

function validateProductData(data) {
    if (!data.name) {
        window.AuthUtils.showNotification('Product name is required', 'error');
        return false;
    }
    if (data.price <= 0) {
        window.AuthUtils.showNotification('Price must be greater than 0', 'error');
        return false;
    }
    if (data.stock < 0) {
        window.AuthUtils.showNotification('Stock cannot be negative', 'error');
        return false;
    }
    return true;
}