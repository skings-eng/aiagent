#!/usr/bin/env node

/**
 * Complete Gemini API Configuration Fix Script
 * 
 * This script will:
 * 1. Check current configuration status
 * 2. Guide user through API key setup
 * 3. Update environment variables and database
 * 4. Test the connection
 * 5. Provide troubleshooting steps
 */

require('dotenv').config({ path: '.env.production' });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, message) {
  console.log(colors[color] + message + colors.reset);
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function checkCurrentStatus() {
  colorLog('cyan', '\n🔍 Checking Current Configuration Status...');
  colorLog('cyan', '='.repeat(50));
  
  const status = {
    envFile: false,
    apiKeySet: false,
    apiKeyValid: false,
    dbConnection: false,
    dbApiKey: false
  };
  
  // Check .env.production file
  const envPath = '.env.production';
  if (fs.existsSync(envPath)) {
    status.envFile = true;
    colorLog('green', '✅ .env.production file exists');
    
    // Check API key in environment
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      status.apiKeySet = true;
      if (!apiKey.includes('Example') && !apiKey.includes('Replace') && !apiKey.includes('your-actual')) {
        status.apiKeyValid = true;
        colorLog('green', '✅ API key appears to be set correctly');
      } else {
        colorLog('yellow', '⚠️  API key is set but appears to be a placeholder');
      }
    } else {
      colorLog('red', '❌ No API key found in environment variables');
    }
  } else {
    colorLog('red', '❌ .env.production file not found');
  }
  
  // Check database connection
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagent');
    status.dbConnection = true;
    colorLog('green', '✅ Database connection successful');
    
    const { Settings } = require('./dist/models/Settings');
    const apiKeySetting = await Settings.getByKey('ai', 'gemini_api_key');
    if (apiKeySetting && apiKeySetting.value) {
      status.dbApiKey = true;
      if (!apiKeySetting.value.includes('Example') && !apiKeySetting.value.includes('Replace')) {
        colorLog('green', '✅ API key found in database');
      } else {
        colorLog('yellow', '⚠️  Database contains placeholder API key');
      }
    } else {
      colorLog('red', '❌ No API key found in database');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    colorLog('red', '❌ Database connection failed: ' + error.message);
  }
  
  return status;
}

async function guideApiKeySetup() {
  colorLog('magenta', '\n🔑 API Key Setup Guide');
  colorLog('magenta', '='.repeat(30));
  
  console.log('\nTo get your Gemini API key:');
  console.log('1. Visit: https://aistudio.google.com/app/apikey');
  console.log('2. Sign in with your Google account');
  console.log('3. Click "Create API Key"');
  console.log('4. Select or create a Google Cloud project');
  console.log('5. Copy the generated API key');
  console.log('\nYour API key should look like: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  
  const rl = createInterface();
  
  try {
    const hasKey = await askQuestion(rl, '\nDo you have a Gemini API key? (y/n): ');
    
    if (hasKey.toLowerCase() !== 'y') {
      colorLog('yellow', '\nPlease get your API key first, then run this script again.');
      colorLog('blue', 'Visit: https://aistudio.google.com/app/apikey');
      return null;
    }
    
    const apiKey = await askQuestion(rl, '\nPlease enter your Gemini API key: ');
    
    if (!apiKey || apiKey.length < 30) {
      colorLog('red', '❌ Invalid API key format. Please check and try again.');
      return null;
    }
    
    if (apiKey.includes('Example') || apiKey.includes('Replace') || apiKey.includes('your-actual')) {
      colorLog('red', '❌ Please enter your actual API key, not a placeholder.');
      return null;
    }
    
    return apiKey;
  } finally {
    rl.close();
  }
}

async function updateEnvironmentFile(apiKey) {
  colorLog('blue', '\n📝 Updating Environment File...');
  
  const envPath = '.env.production';
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add API key lines
  const updates = [
    { key: 'GOOGLE_API_KEY', value: apiKey },
    { key: 'GOOGLE_AI_API_KEY', value: apiKey },
    { key: 'GEMINI_API_KEY', value: apiKey }
  ];
  
  for (const update of updates) {
    const regex = new RegExp(`^${update.key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${update.key}=${update.value}`);
    } else {
      // Add new line if not exists
      if (!envContent.includes(`# Google Gemini`)) {
        envContent += '\n# Google Gemini\n';
      }
      envContent += `${update.key}=${update.value}\n`;
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  colorLog('green', '✅ Environment file updated successfully');
}

async function updateDatabase(apiKey) {
  colorLog('blue', '\n🗄️  Updating Database Configuration...');
  
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagent');
    
    const { Settings } = require('./dist/models/Settings');
    const userObjectId = new mongoose.Types.ObjectId();
    
    // Update API key
    const existingApiKeySetting = await Settings.getByKey('ai', 'gemini_api_key');
    if (existingApiKeySetting) {
      await existingApiKeySetting.updateValue(apiKey, userObjectId, 'API key updated via fix script');
      colorLog('green', '✅ Updated existing API key in database');
    } else {
      await Settings.create({
        category: 'ai',
        key: 'gemini_api_key',
        value: apiKey,
        type: 'string',
        description: 'Gemini AI API key for chat functionality',
        isPublic: false,
        isEditable: true,
        metadata: {
          group: 'gemini',
          sensitive: true,
          restartRequired: false,
        },
        createdBy: userObjectId,
        updatedBy: userObjectId,
      });
      colorLog('green', '✅ Created new API key setting in database');
    }
    
    // Update model setting
    const modelName = 'gemini-2.0-flash-exp';
    const existingModelSetting = await Settings.getByKey('ai', 'gemini_model');
    if (existingModelSetting) {
      await existingModelSetting.updateValue(modelName, userObjectId, 'Model updated via fix script');
    } else {
      await Settings.create({
        category: 'ai',
        key: 'gemini_model',
        value: modelName,
        type: 'string',
        description: 'Gemini AI model version',
        isPublic: false,
        isEditable: true,
        metadata: { group: 'gemini' },
        createdBy: userObjectId,
        updatedBy: userObjectId,
      });
    }
    colorLog('green', '✅ Model setting updated to: ' + modelName);
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    colorLog('red', '❌ Database update failed: ' + error.message);
    return false;
  }
}

async function testApiConnection(apiKey) {
  colorLog('blue', '\n🔗 Testing API Connection...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    colorLog('yellow', '📤 Sending test request...');
    const result = await model.generateContent('Hello! Please respond with "Connection successful" to confirm.');
    const response = await result.response;
    const text = response.text();
    
    colorLog('green', '✅ API connection successful!');
    colorLog('green', '📥 Response: ' + text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    return true;
  } catch (error) {
    colorLog('red', '❌ API connection failed: ' + error.message);
    
    // Provide specific troubleshooting
    if (error.message.includes('API_KEY_INVALID')) {
      colorLog('yellow', '\n🔧 Troubleshooting: Invalid API Key');
      console.log('- Double-check your API key is correctly copied');
      console.log('- Ensure the API key has proper permissions');
      console.log('- Verify the Google Cloud project has Generative AI API enabled');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      colorLog('yellow', '\n🔧 Troubleshooting: Permission Denied');
      console.log('- Check API key permissions in Google Cloud Console');
      console.log('- Ensure Generative AI API is enabled for your project');
      console.log('- Verify billing is set up for your Google Cloud project');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      colorLog('yellow', '\n🔧 Troubleshooting: Quota Exceeded');
      console.log('- Check your API usage limits in Google Cloud Console');
      console.log('- Consider upgrading your plan if needed');
    } else {
      colorLog('yellow', '\n🔧 Troubleshooting: Network/Other Error');
      console.log('- Check your internet connection');
      console.log('- Verify firewall settings allow HTTPS requests');
      console.log('- If behind a proxy, configure proxy settings');
    }
    
    return false;
  }
}

async function provideFinalInstructions(success) {
  colorLog('magenta', '\n📋 Final Instructions');
  colorLog('magenta', '='.repeat(25));
  
  if (success) {
    colorLog('green', '\n🎉 Configuration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your application server:');
    console.log('   - If using PM2: pm2 restart all');
    console.log('   - If running directly: stop and restart your server');
    console.log('2. Test the chat functionality in your web interface');
    console.log('3. Monitor the server logs for any errors');
    
    colorLog('blue', '\n🔍 Verification Commands:');
    console.log('- Test API: node test-gemini.js');
    console.log('- Check logs: pm2 logs (if using PM2)');
    console.log('- Check status: pm2 status (if using PM2)');
  } else {
    colorLog('red', '\n❌ Configuration incomplete');
    console.log('\nPlease address the issues above and try again.');
    console.log('\nFor additional help:');
    console.log('- Read: GEMINI_SETUP_GUIDE.md');
    console.log('- Check: https://aistudio.google.com/app/apikey');
    console.log('- Verify: Google Cloud Console settings');
  }
}

async function main() {
  try {
    colorLog('cyan', '\n🚀 Gemini API Complete Configuration Fix');
    colorLog('cyan', '='.repeat(45));
    
    // Step 1: Check current status
    const status = await checkCurrentStatus();
    
    // Step 2: Guide API key setup if needed
    let apiKey = null;
    if (!status.apiKeyValid) {
      apiKey = await guideApiKeySetup();
      if (!apiKey) {
        process.exit(1);
      }
    } else {
      apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
      colorLog('green', '\n✅ Using existing valid API key');
    }
    
    // Step 3: Update environment file
    await updateEnvironmentFile(apiKey);
    
    // Step 4: Update database
    const dbSuccess = await updateDatabase(apiKey);
    
    // Step 5: Test API connection
    const apiSuccess = await testApiConnection(apiKey);
    
    // Step 6: Provide final instructions
    await provideFinalInstructions(dbSuccess && apiSuccess);
    
  } catch (error) {
    colorLog('red', '\n❌ Script failed: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkCurrentStatus,
  guideApiKeySetup,
  updateEnvironmentFile,
  updateDatabase,
  testApiConnection
};