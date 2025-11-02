const mongoose = require('mongoose');
const Customer = require('./src/models/Customer');

// الاتصال بقاعدة البيانات
const MONGODB_URI = 'mongodb+srv://hassanaserver:hassanaserver123456@hassanaserver.7kojfsh.mongodb.net/?appName=hassanaserver';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // البحث عن العملاء الذين لديهم FCM tokens
    const customers = await Customer.find({
      deviceTokens: { $exists: true, $ne: [] }
    }).select('name phone deviceTokens').limit(10);
    
    console.log(`📊 Found ${customers.length} customers with FCM tokens:\n`);
    
    if (customers.length === 0) {
      console.log('⚠️  No customers have registered FCM tokens yet.');
      console.log('💡 Register a token from Flutter app first.');
    } else {
      customers.forEach((customer, index) => {
        console.log(`${index + 1}. Customer: ${customer.name}`);
        console.log(`   Phone: ${customer.phone}`);
        console.log(`   Tokens: ${customer.deviceTokens.length}`);
        
        customer.deviceTokens.forEach((token, i) => {
          console.log(`   Token ${i + 1}:`);
          console.log(`     Length: ${token.length} characters`);
          console.log(`     Preview: ${token.substring(0, 60)}...`);
          console.log(`     Full: ${token}`);
        });
        console.log('');
      });
    }
    
    // إحصائيات
    const totalCustomers = await Customer.countDocuments();
    const customersWithTokens = await Customer.countDocuments({
      deviceTokens: { $exists: true, $ne: [] }
    });
    
    console.log('📈 Statistics:');
    console.log(`   Total Customers: ${totalCustomers}`);
    console.log(`   Customers with FCM tokens: ${customersWithTokens}`);
    console.log(`   Percentage: ${((customersWithTokens / totalCustomers) * 100).toFixed(2)}%`);
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
