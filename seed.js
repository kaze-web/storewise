// Sample data seeder
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const sampleUsers = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin'
  },
  {
    username: 'staff',
    password: 'staff123',
    name: 'Store Staff',
    role: 'staff'
  }
];

const sampleProducts = [
  {
    name: 'Coca-Cola 1.5L',
    description: 'Soft drink',
    price: 85,
    cost: 65,
    stock: 50,
    minStock: 10,
    category: 'Beverages'
  },
  {
    name: 'Piattos Cheese 85g',
    description: 'Cheese flavored chips',
    price: 25,
    cost: 18,
    stock: 30,
    minStock: 5,
    category: 'Snacks'
  },
  {
    name: 'Bear Brand Milk 140ml',
    description: 'Sterilized milk',
    price: 15,
    cost: 12,
    stock: 40,
    minStock: 8,
    category: 'Dairy'
  },
  {
    name: 'Gardenia Bread 400g',
    description: 'White bread loaf',
    price: 65,
    cost: 50,
    stock: 20,
    minStock: 3,
    category: 'Bakery'
  },
  {
    name: 'Lucky Me Pancit Canton',
    description: 'Instant noodles',
    price: 12,
    cost: 9,
    stock: 100,
    minStock: 15,
    category: 'Noodles'
  },
  {
    name: 'San Miguel Beer 320ml',
    description: 'Pilsen beer',
    price: 45,
    cost: 35,
    stock: 25,
    minStock: 5,
    category: 'Beverages'
  },
  {
    name: 'Close Up Toothpaste 160g',
    description: 'Red hot toothpaste',
    price: 35,
    cost: 25,
    stock: 15,
    minStock: 3,
    category: 'Personal Care'
  },
  {
    name: 'Tissue Happy 200 sheets',
    description: 'Facial tissue',
    price: 28,
    cost: 20,
    stock: 35,
    minStock: 7,
    category: 'Household'
  },
  {
    name: 'Boy Bawang 30g',
    description: 'Corn chips',
    price: 8,
    cost: 6,
    stock: 60,
    minStock: 10,
    category: 'Snacks'
  },
  {
    name: 'Century Tuna 155g',
    description: 'Tuna pie in oil',
    price: 32,
    cost: 25,
    stock: 22,
    minStock: 4,
    category: 'Canned Goods'
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample users
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
    }
    console.log('Sample users inserted');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log('Sample products inserted');

    console.log('Database seeded successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin - Username: admin, Password: admin123');
    console.log('Staff - Username: staff, Password: staff123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;