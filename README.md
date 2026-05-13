# StoreWise POS System

A complete mobile-based Point of Sale (POS) system designed for small retail businesses and sari-sari stores. Built with Node.js, Express, MongoDB, and modern web technologies.

**Note: This is a local/offline prototype system only. It is not configured for cloud deployment or production hosting.**

## Features

### 🔐 Secure Authentication
- JWT-based login system
- Admin and Staff roles
- Password hashing with bcrypt

### 📊 Dashboard Overview
- Daily sales tracking
- Total products count
- Low stock alerts
- Sales analytics with charts
- Top-selling products display

### 🛒 Smart Sales Transaction
- Product search and cart management
- Automatic total calculation
- Receipt generation
- Automatic inventory reduction
- Transaction history

### 📦 Inventory Management
- Add, edit, delete products
- Stock level tracking
- Low stock detection
- Product search and filtering
- Barcode support preparation

### 🔮 Predictive Restocking System
- Sales trend analysis
- Smart restock suggestions
- Demand forecasting
- Automated recommendations

### 📈 Automated Reports
- Daily, weekly, monthly sales reports
- Inventory status reports
- PDF and Excel export
- Profit and sales analytics

### 🔔 Notifications & Alerts
- Low stock warnings
- Restock reminders
- Real-time notifications

### 📱 Mobile-Responsive UI
- Clean, modern interface
- Mobile-first design
- Easy navigation for small store owners

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT
- **Charts**: Chart.js
- **Real-time**: Socket.io

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local instance only)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd storewise-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env` file and update the values:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/storewise
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running locally on your system
   - The default connection is `mongodb://localhost:27017/storewise`
   - Update `MONGODB_URI` in `.env` if your MongoDB is configured differently

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```
   This will add sample users and products to get you started.

6. **Run the application**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

7. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - Default login credentials:
     - Username: `admin`
     - Password: `admin123`

## Project Structure

```
storewise-pos/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── dashboardController.js # Dashboard data
│   ├── productController.js # Product management
│   └── transactionController.js # Sales transactions
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── models/
│   ├── User.js             # User schema
│   ├── Product.js          # Product schema
│   └── Transaction.js      # Transaction schema
├── routes/
│   ├── auth.js             # Auth routes
│   ├── products.js         # Product routes
│   ├── transactions.js     # Transaction routes
│   ├── dashboard.js        # Dashboard routes
│   └── reports.js          # Report routes
├── services/
│   ├── predictiveRestocking.js # Restock logic
│   └── reportService.js    # Report generation
├── public/
│   ├── css/
│   │   └── style.css       # Main styles
│   └── js/
│       ├── auth.js         # Auth utilities
│       ├── dashboard.js    # Dashboard logic
│       ├── products.js     # Product management
│       ├── sales.js        # Sales transaction
│       └── reports.js      # Reports logic
├── views/
│   ├── login.ejs           # Login page
│   ├── dashboard.ejs       # Dashboard page
│   ├── products.ejs        # Products page
│   ├── sales.ejs           # Sales page
│   └── reports.ejs         # Reports page
├── .env                    # Environment variables
├── package.json            # Dependencies
├── server.js               # Main server file
└── README.md               # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products

### Transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get transactions
- `GET /api/transactions/:id` - Get transaction by ID

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/restock-suggestions` - Get restock suggestions

### Reports
- `GET /api/reports/sales` - Get sales report
- `GET /api/reports/inventory` - Get inventory report
- `GET /api/reports/sales/pdf` - Download sales PDF
- `GET /api/reports/sales/excel` - Download sales Excel
- `GET /api/reports/inventory/pdf` - Download inventory PDF
- `GET /api/reports/inventory/excel` - Download inventory Excel

## Database Schema

### User
```javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'staff']),
  name: String (required),
  createdAt: Date
}
```

### Product
```javascript
{
  name: String (required),
  description: String,
  price: Number (required, min: 0),
  cost: Number (min: 0),
  stock: Number (required, min: 0),
  minStock: Number (min: 0),
  barcode: String (unique),
  category: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction
```javascript
{
  transactionId: String (unique),
  items: [{
    product: ObjectId (ref: Product),
    productName: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  totalAmount: Number,
  paymentMethod: String,
  cashier: ObjectId (ref: User),
  createdAt: Date
}
```

## Usage Guide

### Adding Products
1. Go to Products page
2. Click "Add Product" button
3. Fill in product details
4. Save the product

### Processing Sales
1. Go to Sales page
2. Search for products
3. Add products to cart
4. Adjust quantities if needed
5. Click "Checkout"
6. Select payment method
7. Complete the transaction

### Managing Inventory
1. Go to Products page
2. View current stock levels
3. Edit products as needed
4. Monitor low stock alerts

### Generating Reports
1. Go to Reports page
2. Select date range for sales reports
3. Generate inventory reports
4. Download PDF or Excel files

## Future Enhancements

- Barcode scanner integration
- Offline mode support
- Digital payment gateways
- Customer management
- Multi-store support
- Mobile app version
- Advanced analytics
- Email notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.