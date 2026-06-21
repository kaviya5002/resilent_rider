require('dotenv').config();
const https = require('https');

console.log('🌐 GETTING YOUR CURRENT IP ADDRESS');
console.log('==================================');

// Get current public IP
const getCurrentIP = () => {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const ip = JSON.parse(data).ip;
          resolve(ip);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const main = async () => {
  try {
    const ip = await getCurrentIP();
    console.log('✅ Your current public IP:', ip);
    console.log('\n🛠️  IMMEDIATE FIX STEPS:');
    console.log('========================');
    console.log('1. Go to: https://cloud.mongodb.com');
    console.log('2. Click "Network Access" in left sidebar');
    console.log('3. Click "ADD IP ADDRESS" button');
    console.log('4. Choose one option:');
    console.log(`   Option A: Add your current IP: ${ip}`);
    console.log('   Option B: Allow all IPs: 0.0.0.0/0 (easier for development)');
    console.log('5. Click "Confirm"');
    console.log('6. Wait 1-2 minutes for changes to apply');
    console.log('\n⚡ ALTERNATIVE: Use MongoDB Compass');
    console.log('1. Download MongoDB Compass');
    console.log('2. Use this connection string:');
    console.log(`   mongodb+srv://resilentrider:Rider12345@cluster0.fhqr0gw.mongodb.net/resilentrider`);
    console.log('3. If Compass connects, the issue is definitely IP whitelisting');
    
  } catch (error) {
    console.log('❌ Could not get IP:', error.message);
    console.log('\n🛠️  MANUAL STEPS:');
    console.log('1. Go to: https://whatismyipaddress.com');
    console.log('2. Copy your IP address');
    console.log('3. Add it to Atlas Network Access');
  }
};

main();