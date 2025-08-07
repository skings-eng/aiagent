#!/usr/bin/env node

/**
 * 数据库连接测试脚本 v3.0
 * 用于测试 MongoDB 和 Redis 连接
 * 支持 Ubuntu 和 macOS 环境
 * 包含系统环境检查、性能测试和项目配置验证
 */

const mongoose = require('mongoose');
const redis = require('redis');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// 检查是否在正确的目录
const currentDir = process.cwd();
console.log('当前目录:', currentDir);
console.log('操作系统:', os.platform());
console.log('Node.js版本:', process.version);

// 系统环境检查
function checkSystemEnvironment() {
  console.log('\n🔍 检查系统环境...');
  
  try {
    // 检查MongoDB服务状态
    if (os.platform() === 'linux') {
      try {
        const mongoStatus = execSync('systemctl is-active mongod', { encoding: 'utf8' }).trim();
        console.log('MongoDB服务状态:', mongoStatus === 'active' ? '✅ 运行中' : '❌ 未运行');
      } catch (error) {
        console.log('MongoDB服务状态: ❌ 未安装或未启动');
      }
      
      try {
        const redisStatus = execSync('systemctl is-active redis', { encoding: 'utf8' }).trim();
        console.log('Redis服务状态:', redisStatus === 'active' ? '✅ 运行中' : '❌ 未运行');
      } catch (error) {
        console.log('Redis服务状态: ❌ 未安装或未启动');
      }
    } else if (os.platform() === 'darwin') {
      try {
        execSync('brew services list | grep mongodb', { encoding: 'utf8' });
        console.log('MongoDB服务状态: ✅ 已安装 (请检查是否运行)');
      } catch (error) {
        console.log('MongoDB服务状态: ❌ 未通过brew安装');
      }
      
      try {
        execSync('brew services list | grep redis', { encoding: 'utf8' });
        console.log('Redis服务状态: ✅ 已安装 (请检查是否运行)');
      } catch (error) {
        console.log('Redis服务状态: ❌ 未通过brew安装');
      }
    }
    
    // 检查端口占用
    console.log('\n📡 检查端口占用...');
    const ports = [27017, 6379, 3000, 3001];
    ports.forEach(port => {
      try {
        if (os.platform() === 'linux') {
          const result = execSync(`netstat -tlnp | grep :${port}`, { encoding: 'utf8' });
          console.log(`端口 ${port}: ${result ? '✅ 已占用' : '❌ 未占用'}`);
        } else {
          const result = execSync(`lsof -i :${port}`, { encoding: 'utf8' });
          console.log(`端口 ${port}: ${result ? '✅ 已占用' : '❌ 未占用'}`);
        }
      } catch (error) {
        console.log(`端口 ${port}: ❌ 未占用`);
      }
    });
    
  } catch (error) {
    console.error('系统环境检查失败:', error.message);
  }
}

// 测试 MongoDB 连接
async function testMongoDB() {
  console.log('\n🍃 测试 MongoDB 连接...');
  const startTime = Date.now();
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/japan-stock-ai';
    console.log('连接URI:', mongoUri);
    
    // 连接到 MongoDB
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    const connectTime = Date.now() - startTime;
    console.log(`✅ MongoDB 连接成功! (耗时: ${connectTime}ms)`);
    
    // 获取数据库信息
    const db = mongoose.connection.db;
    const admin = db.admin();
    const dbStats = await admin.serverStatus();
    
    console.log('📊 MongoDB 信息:');
    console.log(`  - 版本: ${dbStats.version}`);
    console.log(`  - 主机: ${dbStats.host}`);
    console.log(`  - 进程: ${dbStats.process}`);
    console.log(`  - 连接数: ${dbStats.connections.current}`);
    
    // 列出集合
    const collections = await db.listCollections().toArray();
    console.log(`  - 集合数量: ${collections.length}`);
    if (collections.length > 0) {
      console.log('  - 集合列表:', collections.map(c => c.name).join(', '));
    }
    
    // 性能测试
    console.log('\n⚡ MongoDB 性能测试...');
    const testCollection = db.collection('test_connection');
    
    // 写入测试
    const writeStart = Date.now();
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    const writeTime = Date.now() - writeStart;
    console.log(`  - 写入测试: ${writeTime}ms`);
    
    // 读取测试
    const readStart = Date.now();
    const doc = await testCollection.findOne({ test: true });
    const readTime = Date.now() - readStart;
    console.log(`  - 读取测试: ${readTime}ms`);
    
    // 清理测试数据
    await testCollection.deleteMany({ test: true });
    
    await mongoose.disconnect();
    console.log('✅ MongoDB 测试完成');
    
    return { success: true, connectTime, writeTime, readTime };
    
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    
    // 提供故障排除建议
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 故障排除建议:');
      console.log('1. 检查 MongoDB 服务是否运行:');
      if (os.platform() === 'linux') {
        console.log('   sudo systemctl start mongod');
        console.log('   sudo systemctl enable mongod');
      } else {
        console.log('   brew services start mongodb-community');
      }
      console.log('2. 检查端口 27017 是否被占用');
      console.log('3. 检查防火墙设置');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n💡 认证失败，请检查用户名和密码');
    } else if (error.message.includes('Server selection timed out')) {
      console.log('\n💡 服务器选择超时，请检查网络连接和MongoDB服务状态');
    }
    
    return { success: false, error: error.message };
  }
}

// 测试 Redis 连接
async function testRedis() {
  console.log('\n🔴 测试 Redis 连接...');
  const startTime = Date.now();
  
  const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    connectTimeout: 5000,
    lazyConnect: true
  });
  
  try {
    console.log(`连接配置: ${process.env.REDIS_HOST || 'localhost'}:${parseInt(process.env.REDIS_PORT) || 6379}`);
    
    await client.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Redis 连接成功! (耗时: ${connectTime}ms)`);
    
    // 获取 Redis 信息
    const info = await client.info();
    const lines = info.split('\r\n');
    const redisInfo = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        redisInfo[key] = value;
      }
    });
    
    console.log('📊 Redis 信息:');
    console.log(`  - 版本: ${redisInfo.redis_version || 'N/A'}`);
    console.log(`  - 模式: ${redisInfo.redis_mode || 'N/A'}`);
    console.log(`  - 内存使用: ${redisInfo.used_memory_human || 'N/A'}`);
    console.log(`  - 连接客户端: ${redisInfo.connected_clients || 'N/A'}`);
    console.log(`  - 运行时间: ${redisInfo.uptime_in_seconds ? Math.floor(redisInfo.uptime_in_seconds / 3600) + '小时' : 'N/A'}`);
    
    // 性能测试
    console.log('\n⚡ Redis 性能测试...');
    
    // 写入测试
    const writeStart = Date.now();
    await client.set('test_key', 'test_value');
    const writeTime = Date.now() - writeStart;
    console.log(`  - 写入测试: ${writeTime}ms`);
    
    // 读取测试
    const readStart = Date.now();
    const value = await client.get('test_key');
    const readTime = Date.now() - readStart;
    console.log(`  - 读取测试: ${readTime}ms`);
    console.log(`  - 读取结果: ${value}`);
    
    // 批量操作测试
    const batchStart = Date.now();
    const pipeline = client.multi();
    for (let i = 0; i < 10; i++) {
      pipeline.set(`batch_key_${i}`, `batch_value_${i}`);
    }
    await pipeline.exec();
    const batchTime = Date.now() - batchStart;
    console.log(`  - 批量写入(10条): ${batchTime}ms`);
    
    // 清理测试数据
    await client.del('test_key');
    for (let i = 0; i < 10; i++) {
      await client.del(`batch_key_${i}`);
    }
    
    await client.quit();
    console.log('✅ Redis 测试完成');
    
    return { success: true, connectTime, writeTime, readTime, batchTime };
    
  } catch (error) {
    console.error('❌ Redis 连接失败:', error.message);
    
    // 提供故障排除建议
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 故障排除建议:');
      console.log('1. 检查 Redis 服务是否运行:');
      if (os.platform() === 'linux') {
        console.log('   sudo systemctl start redis');
        console.log('   sudo systemctl enable redis');
      } else {
        console.log('   brew services start redis');
      }
      console.log('2. 检查端口 6379 是否被占用');
      console.log('3. 检查 Redis 配置文件');
    } else if (error.message.includes('WRONGPASS')) {
      console.log('\n💡 密码错误，请检查 REDIS_PASSWORD 环境变量');
    } else if (error.message.includes('NOAUTH')) {
      console.log('\n💡 需要认证，请设置 REDIS_PASSWORD 环境变量');
    }
    
    try {
      await client.quit();
    } catch (e) {
      // 忽略关闭连接时的错误
    }
    
    return { success: false, error: error.message };
  }
}

// 测试项目配置
function testProjectConfiguration() {
  console.log('\n⚙️ 检查项目配置...');
  
  try {
    // 检查 .env 文件
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      console.log('✅ .env 文件存在');
      
      // 读取并检查关键环境变量
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = ['MONGODB_URI', 'REDIS_HOST', 'REDIS_PORT', 'GEMINI_API_KEY', 'LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET'];
      
      console.log('\n🔑 环境变量检查:');
      envVars.forEach(varName => {
        if (envContent.includes(varName)) {
          const value = process.env[varName];
          if (value && value.trim() !== '') {
            console.log(`  ✅ ${varName}: 已设置`);
          } else {
            console.log(`  ⚠️ ${varName}: 已定义但值为空`);
          }
        } else {
          console.log(`  ❌ ${varName}: 未定义`);
        }
      });
    } else {
      console.log('⚠️ .env 文件不存在');
    }
    
    // 检查项目结构
    console.log('\n📁 项目结构检查:');
    const requiredDirs = [
      'backend/api/src',
      'backend/linebot/src', 
      'frontend/c-end/src',
      'mcp-server'
    ];
    
    requiredDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        console.log(`  ✅ ${dir}`);
      } else {
        console.log(`  ❌ ${dir}`);
      }
    });
    
    // 检查关键文件
    console.log('\n📄 关键文件检查:');
    const requiredFiles = [
      'package.json',
      'backend/api/package.json',
      'frontend/c-end/package.json',
      'ecosystem.config.js',
      'install-ubuntu.sh'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ❌ ${file}`);
      }
    });
    
    // 检查 package.json 依赖
    const packageJsonPath = path.join(process.cwd(), 'backend/api/package.json');
    if (fs.existsSync(packageJsonPath)) {
      console.log('\n📦 依赖检查:');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const requiredDeps = ['mongoose', 'redis', 'express', 'dotenv'];
      const requiredDevDeps = ['nodemon'];
      
      console.log('  生产依赖:');
      requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          console.log(`    ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
          console.log(`    ❌ ${dep}: 未安装`);
        }
      });
      
      console.log('  开发依赖:');
      requiredDevDeps.forEach(dep => {
        if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          console.log(`    ✅ ${dep}: ${packageJson.devDependencies[dep]}`);
        } else {
          console.log(`    ❌ ${dep}: 未安装`);
        }
      });
      
      // 检查特殊依赖
      if (packageJson.dependencies && packageJson.dependencies['@line/bot-sdk']) {
        console.log(`    ✅ @line/bot-sdk: ${packageJson.dependencies['@line/bot-sdk']}`);
      } else {
        console.log('    ⚠️ @line/bot-sdk: 未安装 (LINE Bot 功能需要)');
      }
    }
    
    // 检查编译文件
    console.log('\n🔨 编译文件检查:');
    const distDirs = ['backend/api/dist', 'backend/linebot/dist'];
    distDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        console.log(`  ✅ ${dir} (${files.length} 个文件)`);
      } else {
        console.log(`  ❌ ${dir}`);
      }
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ 项目配置检查失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主函数
async function main() {
  console.log('🚀 开始数据库连接测试...');
  console.log('测试时间:', new Date().toLocaleString());
  
  const startTime = Date.now();
  const results = {};
  
  try {
    // 加载环境变量
    require('dotenv').config();
    
    // 1. 系统环境检查
    console.log('\n' + '='.repeat(60));
    console.log('📋 第1步: 系统环境检查');
    console.log('='.repeat(60));
    const envStart = Date.now();
    checkSystemEnvironment();
    results.systemCheck = { success: true, time: Date.now() - envStart };
    
    // 2. MongoDB 测试
    console.log('\n' + '='.repeat(60));
    console.log('📋 第2步: MongoDB 连接测试');
    console.log('='.repeat(60));
    results.mongodb = await testMongoDB();
    
    // 3. Redis 测试
    console.log('\n' + '='.repeat(60));
    console.log('📋 第3步: Redis 连接测试');
    console.log('='.repeat(60));
    results.redis = await testRedis();
    
    // 4. 项目配置检查
    console.log('\n' + '='.repeat(60));
    console.log('📋 第4步: 项目配置检查');
    console.log('='.repeat(60));
    const configStart = Date.now();
    results.config = testProjectConfiguration();
    results.config.time = Date.now() - configStart;
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  // 生成测试报告
  const totalTime = Date.now() - startTime;
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试报告');
  console.log('='.repeat(60));
  
  console.log('\n🔍 测试结果:');
  console.log(`  系统环境检查: ${results.systemCheck?.success ? '✅ 通过' : '❌ 失败'} (${results.systemCheck?.time || 0}ms)`);
  console.log(`  MongoDB 连接: ${results.mongodb?.success ? '✅ 通过' : '❌ 失败'} (${results.mongodb?.connectTime || 0}ms)`);
  console.log(`  Redis 连接: ${results.redis?.success ? '✅ 通过' : '❌ 失败'} (${results.redis?.connectTime || 0}ms)`);
  console.log(`  项目配置检查: ${results.config?.success ? '✅ 通过' : '❌ 失败'} (${results.config?.time || 0}ms)`);
  
  console.log(`\n⏱️ 总耗时: ${totalTime}ms`);
  console.log(`📅 测试完成时间: ${new Date().toLocaleString()}`);
  
  // 根据测试结果提供建议
  const allPassed = results.mongodb?.success && results.redis?.success && results.config?.success;
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！数据库连接正常，可以启动应用。');
    console.log('\n💡 下一步操作:');
    console.log('1. 启动后端API: cd backend/api && npm run dev');
    console.log('2. 启动前端: cd frontend/c-end && npm run dev');
    console.log('3. 或使用PM2启动: pm2 start ecosystem.config.js');
  } else {
    console.log('\n⚠️ 部分测试失败，请根据上述错误信息进行故障排除。');
    
    if (!results.mongodb?.success) {
      console.log('\n🔧 MongoDB 故障排除:');
      console.log('- 确保 MongoDB 服务正在运行');
      console.log('- 检查连接字符串和端口');
      console.log('- 验证网络连接');
    }
    
    if (!results.redis?.success) {
      console.log('\n🔧 Redis 故障排除:');
      console.log('- 确保 Redis 服务正在运行');
      console.log('- 检查连接配置和端口');
      console.log('- 验证认证信息');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testMongoDB,
  testRedis,
  testProjectConfiguration,
  checkSystemEnvironment,
  main
};