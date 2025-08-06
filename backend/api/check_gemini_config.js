const mongoose = require('mongoose');
const { Settings } = require('./dist/models/Settings');

async function checkGeminiConfig() {
  try {
    await mongoose.connect('mongodb://localhost:27017/japan-stock-ai');
    console.log('Connected to MongoDB');
    
    const modelSetting = await Settings.getByKey('ai', 'gemini_model');
    console.log('Current model setting:', modelSetting ? modelSetting.value : 'Not found');
    
    const apiKeySetting = await Settings.getByKey('ai', 'gemini_api_key');
    console.log('API key exists:', !!apiKeySetting);
    console.log('API key length:', apiKeySetting ? apiKeySetting.value.length : 0);
    
    const maxTokensSetting = await Settings.getByKey('ai', 'gemini_max_tokens');
    console.log('Max tokens setting:', maxTokensSetting ? maxTokensSetting.value : 'Not found');
    
    const temperatureSetting = await Settings.getByKey('ai', 'gemini_temperature');
    console.log('Temperature setting:', temperatureSetting ? temperatureSetting.value : 'Not found');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkGeminiConfig();