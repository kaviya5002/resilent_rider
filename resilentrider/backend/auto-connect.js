require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔄 AUTO-RETRY MONGODB CONNECTION');
console.log('================================');
console.log('This will keep trying to connect every 10 seconds...');
console.log('Fix your Atlas IP whitelist and this will connect automatically!');
console.log('\n📋 YOUR IP TO WHITELIST: 103.183.240.250');
console.log('🔗 Atlas URL: https://cloud.mongodb.com');
console.log('\nPress Ctrl+C to stop\n');

let attempt = 1;

const testConnection = async () => {
  try {
    console.log(`⏳ Attempt ${attempt}: Connecting to MongoDB Atlas...`);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    console.log('🎉 SUCCESS! MongoDB Connected!');
    console.log('✅ Host:', conn.connection.host);
    console.log('✅ Database:', conn.connection.name);
    
    // Test a quick operation
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('QuickTest', testSchema);
    const doc = await TestModel.create({ test: 'Connection works!' });
    await TestModel.deleteOne({ _id: doc._id });
    
    console.log('✅ Database operations working!');
    console.log('\n🚀 Ready to start the backend server!');
    console.log('Run: node server.js');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.log(`❌ Attempt ${attempt} failed:`, error.message.split('.')[0]);
    attempt++;
    
    if (attempt <= 20) {
      console.log('⏰ Retrying in 10 seconds...\n');
      setTimeout(testConnection, 10000);
    } else {
      console.log('\n⏹️  Stopped after 20 attempts.');
      console.log('Please check your Atlas Network Access settings.');
      process.exit(1);
    }
  }
};

// Start testing
testConnection();