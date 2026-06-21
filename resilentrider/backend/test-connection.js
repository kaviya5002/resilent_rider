require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');

const testConnection = async () => {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected:', conn.connection.host);
    console.log('✅ Database:', conn.connection.name);
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const doc = await TestModel.create({ test: 'Connection successful' });
    console.log('✅ Test document created:', doc._id);
    
    await TestModel.deleteOne({ _id: doc._id });
    console.log('✅ Test document deleted');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();