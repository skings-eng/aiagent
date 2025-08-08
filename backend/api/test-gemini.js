require('dotenv').config({ path: '.env.production' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('🔍 Testing Gemini API Configuration...');
  console.log('=====================================\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleAiApiKey = process.env.GOOGLE_AI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  console.log('GOOGLE_API_KEY:', googleApiKey ? googleApiKey.substring(0, 10) + '...' : '❌ Not set');
  console.log('GOOGLE_AI_API_KEY:', googleAiApiKey ? googleAiApiKey.substring(0, 10) + '...' : '❌ Not set');
  console.log('GEMINI_API_KEY:', geminiApiKey ? geminiApiKey.substring(0, 10) + '...' : '❌ Not set');
  
  // Determine which API key to use (same logic as app.ts)
  const apiKey = googleApiKey || googleAiApiKey || geminiApiKey;
  
  if (!apiKey) {
    console.error('\n❌ ERROR: No Gemini API key found in environment variables!');
    console.log('\n📝 To fix this:');
    console.log('1. Get an API key from: https://aistudio.google.com/app/apikey');
    console.log('2. Update .env.production file with your real API key');
    console.log('3. Set GOOGLE_API_KEY=your_actual_api_key');
    return false;
  }
  
  if (apiKey.includes('Example') || apiKey.includes('your-actual') || apiKey.includes('Replace')) {
    console.error('\n❌ ERROR: API key appears to be a placeholder!');
    console.log('Current key:', apiKey.substring(0, 30) + '...');
    console.log('\n📝 Please replace with your actual Gemini API key from:');
    console.log('https://aistudio.google.com/app/apikey');
    return false;
  }
  
  console.log('\n✅ Using API key:', apiKey.substring(0, 10) + '...');
  
  // Test API connection
  console.log('\n🔗 Testing API Connection...');
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('📤 Sending test request...');
    const result = await model.generateContent('Hello! Please respond with "API connection successful" to confirm the connection is working.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API connection successful!');
    console.log('📥 Response:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    return true;
  } catch (error) {
    console.error('\n❌ Gemini API connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n🔧 This error suggests your API key is invalid.');
      console.log('Please check:');
      console.log('1. API key is correctly copied from Google AI Studio');
      console.log('2. API key has proper permissions');
      console.log('3. Google Cloud project has Generative AI API enabled');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔧 Permission denied error.');
      console.log('Please check:');
      console.log('1. API key permissions in Google Cloud Console');
      console.log('2. Generative AI API is enabled for your project');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('\n🔧 Quota exceeded error.');
      console.log('Please check your API usage limits in Google Cloud Console.');
    } else {
      console.log('\n🔧 Network or other error.');
      console.log('Please check:');
      console.log('1. Internet connection');
      console.log('2. Firewall settings');
      console.log('3. Proxy configuration if applicable');
    }
    
    return false;
  }
}

// Test database configuration
async function testDatabaseConfig() {
  console.log('\n🗄️  Testing Database Configuration...');
  console.log('=====================================');
  
  try {
    const mongoose = require('mongoose');
    const { Settings } = require('./dist/models/Settings');
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagent');
    console.log('✅ Connected to MongoDB');
    
    // Check API key setting
    const apiKeySetting = await Settings.getByKey('ai', 'gemini_api_key');
    if (apiKeySetting) {
      console.log('✅ Found API key in database:', apiKeySetting.value.substring(0, 10) + '...');
      
      if (apiKeySetting.value.includes('Example') || apiKeySetting.value.includes('Replace')) {
        console.log('⚠️  Database contains placeholder API key');
      }
    } else {
      console.log('❌ No API key found in database');
    }
    
    // Check model setting
    const modelSetting = await Settings.getByKey('ai', 'gemini_model');
    if (modelSetting) {
      console.log('✅ Found model setting:', modelSetting.value);
    } else {
      console.log('❌ No model setting found in database');
    }
    
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Gemini Configuration Tests\n');
  
  const apiTest = await testGemini();
  const dbTest = await testDatabaseConfig();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log('API Connection:', apiTest ? '✅ PASS' : '❌ FAIL');
  console.log('Database Config:', dbTest ? '✅ PASS' : '❌ FAIL');
  
  if (apiTest && dbTest) {
    console.log('\n🎉 All tests passed! Gemini API should be working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application server');
    console.log('2. Test the chat functionality in your web interface');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above before proceeding.');
    console.log('\n📖 For detailed setup instructions, see: GEMINI_SETUP_GUIDE.md');
  }
}

runAllTests().catch(console.error);