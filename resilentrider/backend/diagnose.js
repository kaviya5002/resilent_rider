require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔧 MONGODB CONNECTION DIAGNOSTICS');
console.log('================================');

// Check environment variables
console.log('1. Environment Check:');
console.log('   PORT:', process.env.PORT || 'Not set');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✅' : 'Not set ❌');
console.log('   MONGO_URI:', process.env.MONGO_URI ? 'Set ✅' : 'Not set ❌');

if (process.env.MONGO_URI) {
  console.log('   MONGO_URI value:', process.env.MONGO_URI);
  
  // Parse the URI
  try {
    const url = new URL(process.env.MONGO_URI.replace('mongodb+srv://', 'https://'));
    console.log('   Username:', url.username || 'Not found');
    console.log('   Password:', url.password ? 'Set ✅' : 'Not set ❌');
    console.log('   Host:', url.hostname || 'Not found');
    console.log('   Database:', process.env.MONGO_URI.split('/')[3]?.split('?')[0] || 'Not specified');
  } catch (e) {
    console.log('   ❌ URI parsing failed:', e.message);
  }
}

console.log('\n2. Testing Connection:');

const testConnection = async () => {
  if (!process.env.MONGO_URI) {
    console.log('❌ MONGO_URI not found in .env file');
    return;
  }

  try {
    console.log('⏳ Attempting connection...');
    
    // Set connection options for better error handling
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false,
      maxPoolSize: 10,
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log('✅ SUCCESS! MongoDB Connected');
    console.log('   Host:', conn.connection.host);
    console.log('   Database:', conn.connection.name);
    console.log('   Ready State:', conn.connection.readyState); // 1 = connected
    
    // Test basic operations
    console.log('\n3. Testing Database Operations:');
    
    const testSchema = new mongoose.Schema({ 
      test: String, 
      timestamp: { type: Date, default: Date.now }
    });
    const TestModel = mongoose.model('ConnectionTest', testSchema);
    
    console.log('⏳ Creating test document...');
    const doc = await TestModel.create({ test: 'Backend connection successful!' });
    console.log('✅ Document created with ID:', doc._id);
    
    console.log('⏳ Reading test document...');
    const found = await TestModel.findById(doc._id);
    console.log('✅ Document found:', found.test);
    
    console.log('⏳ Deleting test document...');
    await TestModel.deleteOne({ _id: doc._id });
    console.log('✅ Document deleted');
    
    console.log('\n🎉 ALL TESTS PASSED! MongoDB is working perfectly.');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed cleanly');
    
  } catch (error) {
    console.log('\n❌ CONNECTION FAILED');
    console.log('Error Type:', error.name);
    console.log('Error Message:', error.message);
    
    // Specific error diagnostics
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔍 DIAGNOSIS: DNS Resolution Failed');
      console.log('   - Check your internet connection');
      console.log('   - Verify the cluster hostname in your URI');
    } else if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.log('\n🔍 DIAGNOSIS: Authentication Failed');
      console.log('   - Username or password is incorrect');
      console.log('   - Check Database Access in Atlas');
      console.log('   - Ensure user has readWrite permissions');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log('\n🔍 DIAGNOSIS: IP Not Whitelisted');
      console.log('   - Go to Atlas → Network Access');
      console.log('   - Add your current IP or use 0.0.0.0/0');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔍 DIAGNOSIS: Connection Timeout');
      console.log('   - Network connectivity issue');
      console.log('   - Firewall blocking connection');
    }
    
    console.log('\n🛠️  QUICK FIXES:');
    console.log('1. Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
    console.log('2. Atlas → Database Access → Edit User → Reset Password');
    console.log('3. Check if your cluster is paused (Atlas → Clusters)');
    
    process.exit(1);
  }
};

testConnection();