#!/usr/bin/env node

/**
 * Gemini API Setup Verification Script
 * 
 * Quick verification that Gemini API is properly configured
 */

require('dotenv').config({ path: '.env.production' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function quickVerification() {
  console.log('🔍 Quick Gemini API Verification\n');
  
  // Check environment variable
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.log('❌ GOOGLE_API_KEY not found in environment');
    return false;
  }
  
  if (apiKey.includes('Example') || apiKey.includes('Replace')) {
    console.log('❌ API key appears to be a placeholder');
    return false;
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
  
  // Test API connection
  try {
    console.log('🔗 Testing API connection...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent('Say "Hello from Gemini!"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API connection successful!');
    console.log('📥 Response:', text);
    return true;
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    return false;
  }
}

async function checkDatabaseConfig() {
  console.log('\n🗄️  Checking database configuration...');
  
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagent');
    
    const { Settings } = require('./dist/models/Settings');
    const apiKeySetting = await Settings.getByKey('ai', 'gemini_api_key');
    const modelSetting = await Settings.getByKey('ai', 'gemini_model');
    
    if (apiKeySetting && modelSetting) {
      console.log('✅ Database configuration complete');
      console.log('   API Key:', apiKeySetting.value.substring(0, 10) + '...');
      console.log('   Model:', modelSetting.value);
    } else {
      console.log('❌ Database configuration incomplete');
    }
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    return false;
  }
}

async function main() {
  const apiTest = await quickVerification();
  const dbTest = await checkDatabaseConfig();
  
  console.log('\n📊 Verification Results:');
  console.log('========================');
  console.log('API Connection:', apiTest ? '✅ PASS' : '❌ FAIL');
  console.log('Database Config:', dbTest ? '✅ PASS' : '❌ FAIL');
  
  if (apiTest && dbTest) {
    console.log('\n🎉 Gemini API is ready to use!');
    console.log('\nYou can now:');
    console.log('- Use the chat functionality in your web interface');
    console.log('- Send messages and receive AI responses');
    console.log('- Monitor server logs for any issues');
  } else {
    console.log('\n⚠️  Please fix the issues above before using the chat feature.');
  }
}

main().catch(console.error);