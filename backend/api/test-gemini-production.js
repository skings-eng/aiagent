#!/usr/bin/env node

/**
 * 生产环境Gemini API配置测试脚本
 * 用于诊断AI服务连接问题
 */

require('dotenv').config({ path: './.env.production' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('=== 生产环境Gemini API配置测试 ===\n');

// 1. 检查环境变量
console.log('1. 检查环境变量配置:');
const googleApiKey = process.env.GOOGLE_API_KEY;
const googleAiApiKey = process.env.GOOGLE_AI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

console.log('   GOOGLE_API_KEY:', googleApiKey ? `${googleApiKey.substring(0, 10)}...` : '❌ 未设置');
console.log('   GOOGLE_AI_API_KEY:', googleAiApiKey ? `${googleAiApiKey.substring(0, 10)}...` : '❌ 未设置');
console.log('   GEMINI_API_KEY:', geminiApiKey ? `${geminiApiKey.substring(0, 10)}...` : '❌ 未设置');

// 确定使用的API key
const apiKey = googleApiKey || googleAiApiKey || geminiApiKey;

if (!apiKey) {
  console.log('\n❌ 错误: 没有找到有效的API key');
  console.log('\n解决方案:');
  console.log('1. 检查 backend/api/.env.production 文件');
  console.log('2. 确保设置了 GOOGLE_API_KEY=你的真实API密钥');
  console.log('3. 从 https://aistudio.google.com/app/apikey 获取API密钥');
  process.exit(1);
}

console.log(`\n2. 使用API key: ${apiKey.substring(0, 10)}...`);
console.log(`   长度: ${apiKey.length} 字符`);

// 2. 验证API key格式
console.log('\n3. 验证API key格式:');
if (apiKey.startsWith('AIza')) {
  console.log('   ✅ API key格式正确 (以AIza开头)');
} else {
  console.log('   ⚠️  API key格式可能不正确 (通常应以AIza开头)');
}

// 3. 测试API连接
console.log('\n4. 测试Gemini API连接...');

async function testGeminiAPI() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('   正在发送测试请求...');
    
    const result = await model.generateContent('请用中文回答：你好，这是一个API连接测试。');
    const response = await result.response;
    const text = response.text();
    
    console.log('   ✅ API连接成功!');
    console.log('   响应内容:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    return true;
  } catch (error) {
    console.log('   ❌ API连接失败!');
    console.log('   错误类型:', error.constructor.name);
    console.log('   错误信息:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n   🔍 诊断: API密钥无效');
      console.log('   解决方案:');
      console.log('   1. 检查API密钥是否正确');
      console.log('   2. 确认API密钥是否已启用');
      console.log('   3. 检查API密钥是否有足够的配额');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n   🔍 诊断: 权限被拒绝');
      console.log('   解决方案:');
      console.log('   1. 检查API密钥权限设置');
      console.log('   2. 确认Gemini API是否已启用');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('\n   🔍 诊断: 配额已用完');
      console.log('   解决方案:');
      console.log('   1. 检查API使用配额');
      console.log('   2. 等待配额重置或升级计划');
    } else {
      console.log('\n   🔍 诊断: 网络或其他问题');
      console.log('   解决方案:');
      console.log('   1. 检查网络连接');
      console.log('   2. 检查防火墙设置');
      console.log('   3. 稍后重试');
    }
    
    return false;
  }
}

// 4. 测试股票分析场景
async function testStockAnalysis() {
  try {
    console.log('\n5. 测试股票分析场景...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const stockPrompt = `你是专业的股票分析AI助手。请分析苹果公司(AAPL)的投资价值，用中文回答，并按以下JSON格式输出：

{
  "name": "公司名称",
  "code": "股票代码",
  "analysis": "简要分析"
}`;
    
    console.log('   正在测试股票分析功能...');
    
    const result = await model.generateContent(stockPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('   ✅ 股票分析功能正常!');
    console.log('   分析结果:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    
    return true;
  } catch (error) {
    console.log('   ❌ 股票分析功能测试失败!');
    console.log('   错误信息:', error.message);
    return false;
  }
}

// 主测试流程
async function runTests() {
  const apiTest = await testGeminiAPI();
  
  if (apiTest) {
    await testStockAnalysis();
  }
  
  console.log('\n=== 测试总结 ===');
  
  if (apiTest) {
    console.log('✅ Gemini API配置正常，可以正常使用');
    console.log('\n建议检查:');
    console.log('1. 确认生产环境服务器已重启');
    console.log('2. 检查数据库中的AI配置是否正确');
    console.log('3. 查看应用日志中的详细错误信息');
  } else {
    console.log('❌ Gemini API配置有问题，需要修复');
    console.log('\n修复步骤:');
    console.log('1. 获取新的API密钥: https://aistudio.google.com/app/apikey');
    console.log('2. 更新 backend/api/.env.production 文件');
    console.log('3. 重启生产环境服务');
  }
}

runTests().catch(console.error);