require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.get('/products', (req, res) => {
  res.render('products');
});

app.get('/sales', (req, res) => {
  res.render('sales');
});

app.get('/receipts', (req, res) => {
  res.render('receipts');
});

app.get('/reports', (req, res) => {
  res.render('reports');
});

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible in routes
app.set('io', io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});