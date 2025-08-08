require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const { Settings } = require('./dist/models/Settings');

async function updateGeminiConfig() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagent');
    console.log('Connected to MongoDB');

    // Check current environment variables
    console.log('\nEnvironment Variables:');
    console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 10) + '...' : 'Not set');
    console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? process.env.GOOGLE_AI_API_KEY.substring(0, 10) + '...' : 'Not set');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'Not set');

    // Use GOOGLE_API_KEY as primary, fallback to GOOGLE_AI_API_KEY
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('\nERROR: No Gemini API key found in environment variables!');
      console.log('Please set GOOGLE_API_KEY in your .env.production file');
      console.log('You can get an API key from: https://aistudio.google.com/app/apikey');
      return;
    }

    if (apiKey.includes('Example') || apiKey.includes('your-actual') || apiKey.includes('Replace')) {
      console.error('\nERROR: Please replace the placeholder API key with your actual Gemini API key!');
      console.log('Current key appears to be a placeholder:', apiKey.substring(0, 20) + '...');
      console.log('Get your API key from: https://aistudio.google.com/app/apikey');
      return;
    }

    console.log('\nUpdating Gemini configuration in database...');
    console.log('Using API key:', apiKey.substring(0, 10) + '...');

    // Create a default ObjectId for settings
    const userObjectId = new mongoose.Types.ObjectId();

    // Update or create API key setting
    const existingApiKeySetting = await Settings.getByKey('ai', 'gemini_api_key');
    if (existingApiKeySetting) {
      await existingApiKeySetting.updateValue(apiKey, userObjectId, 'API key updated via configuration script');
      console.log('✓ Updated existing API key setting');
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
      console.log('✓ Created new API key setting');
    }

    // Update model setting
    const existingModelSetting = await Settings.getByKey('ai', 'gemini_model');
    const modelName = 'gemini-2.5-pro';
    if (existingModelSetting) {
      await existingModelSetting.updateValue(modelName, userObjectId, 'Model updated via configuration script');
      console.log('✓ Updated model setting to:', modelName);
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
      console.log('✓ Created model setting:', modelName);
    }

    console.log('\n✅ Gemini configuration updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Make sure your API key is valid and has proper permissions');
    console.log('2. Restart your application to load the new configuration');
    console.log('3. Test the chat functionality');

  } catch (error) {
    console.error('❌ Error updating Gemini configuration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateGeminiConfig();