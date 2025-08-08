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

// 方法1: 直接测试MongoDB连接
async function testMongoDB() {
  try {
    const mongoose = require('mongoose');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/japan-stock-ai';
    
    console.log('\n🔍 测试MongoDB连接...');
    console.log('连接URI:', MONGODB_URI);
    
    const startTime = Date.now();
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    
    const connectTime = Date.now() - startTime;
    console.log(`✅ MongoDB连接成功! (耗时: ${connectTime}ms)`);
    
    // 测试数据库操作
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📊 数据库集合数量:', collections.length);
    
    if (collections.length > 0) {
      console.log('📋 集合列表:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    // 性能测试
    console.log('\n⚡ 执行性能测试...');
    const testCollection = db.collection('test_performance');
    
    // 写入测试
    const writeStartTime = Date.now();
    await testCollection.insertOne({ test: 'performance', timestamp: new Date() });
    const writeTime = Date.now() - writeStartTime;
    console.log(`写入测试: ${writeTime}ms`);
    
    // 读取测试
    const readStartTime = Date.now();
    const doc = await testCollection.findOne({ test: 'performance' });
    const readTime = Date.now() - readStartTime;
    console.log(`读取测试: ${readTime}ms`);
    
    // 清理测试数据
    await testCollection.deleteOne({ test: 'performance' });
    
    // 显示连接信息
    console.log('\n📈 连接信息:');
    console.log('- 数据库名称:', mongoose.connection.name);
    console.log('- 连接状态:', mongoose.connection.readyState === 1 ? '已连接' : '未连接');
    console.log('- 主机:', mongoose.connection.host);
    console.log('- 端口:', mongoose.connection.port);
    
    await mongoose.disconnect();
    console.log('🔌 MongoDB连接已断开');
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    
    // 提供故障排除建议
    console.log('\n🔧 故障排除建议:');
    if (error.message.includes('ECONNREFUSED')) {
      console.log('- MongoDB服务未启动，请运行: sudo systemctl start mongod');
    } else if (error.message.includes('Authentication failed')) {
      console.log('- 认证失败，请检查用户名和密码');
    } else if (error.message.includes('Server selection timed out')) {
      console.log('- 服务器选择超时，请检查网络连接和MongoDB服务状态');
    }
    console.log('- 检查MongoDB配置文件: /etc/mongod.conf');
    console.log('- 查看MongoDB日志: sudo journalctl -u mongod');
  }
}

// 方法2: 直接测试Redis连接
async function testRedis() {
  try {
    const { createClient } = require('redis');
    
    console.log('\n🔍 测试Redis连接...');
    
    const REDIS_CONFIG = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
    };
    
    console.log('Redis配置:', REDIS_CONFIG);
    
    const startTime = Date.now();
    
    const client = createClient({
      socket: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      },
      password: REDIS_CONFIG.password,
      database: REDIS_CONFIG.db,
    });
    
    await client.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Redis连接成功! (耗时: ${connectTime}ms)`);
    
    // 获取Redis信息
    console.log('\n📈 Redis信息:');
    const info = await client.info();
    const lines = info.split('\r\n');
    const redisInfo = {};
    lines.forEach(line => {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        redisInfo[key] = value;
      }
    });
    
    console.log('- Redis版本:', redisInfo.redis_version || '未知');
    console.log('- 运行模式:', redisInfo.redis_mode || '未知');
    console.log('- 已用内存:', redisInfo.used_memory_human || '未知');
    console.log('- 连接客户端数:', redisInfo.connected_clients || '未知');
    console.log('- 运行时间(秒):', redisInfo.uptime_in_seconds || '未知');
    
    // 性能测试
    console.log('\n⚡ 执行性能测试...');
    
    // 写入测试
    const writeStartTime = Date.now();
    await client.set('test-performance', JSON.stringify({ test: 'performance', timestamp: new Date() }));
    const writeTime = Date.now() - writeStartTime;
    console.log(`写入测试: ${writeTime}ms`);
    
    // 读取测试
    const readStartTime = Date.now();
    const value = await client.get('test-performance');
    const readTime = Date.now() - readStartTime;
    console.log(`读取测试: ${readTime}ms`);
    console.log('📊 Redis测试操作成功, 值:', JSON.parse(value));
    
    // 批量操作测试
    const batchStartTime = Date.now();
    const pipeline = client.multi();
    for (let i = 0; i < 100; i++) {
      pipeline.set(`batch-test-${i}`, `value-${i}`);
    }
    await pipeline.exec();
    const batchTime = Date.now() - batchStartTime;
    console.log(`批量写入测试(100条): ${batchTime}ms`);
    
    // 清理测试数据
    await client.del('test-performance');
    for (let i = 0; i < 100; i++) {
      await client.del(`batch-test-${i}`);
    }
    
    await client.quit();
    console.log('🔌 Redis连接已断开');
    
  } catch (error) {
    console.error('❌ Redis连接失败:', error.message);
    
    // 提供故障排除建议
    console.log('\n🔧 故障排除建议:');
    if (error.message.includes('ECONNREFUSED')) {
      console.log('- Redis服务未启动，请运行: sudo systemctl start redis');
    } else if (error.message.includes('WRONGPASS')) {
      console.log('- Redis密码错误，请检查REDIS_PASSWORD环境变量');
    } else if (error.message.includes('NOAUTH')) {
      console.log('- Redis需要认证，请设置REDIS_PASSWORD环境变量');
    }
    console.log('- 检查Redis配置文件: /etc/redis/redis.conf');
    console.log('- 查看Redis日志: sudo journalctl -u redis');
    console.log('- 测试Redis连接: redis-cli ping');
  }
}

// 方法3: 检查项目配置和环境变量
async function testProjectConfiguration() {
  console.log('\n🔍 检查项目配置...');
  
  try {
    // 检查环境变量文件
    const envFiles = ['.env', '.env.local', '.env.production'];
    console.log('\n📄 环境变量文件检查:');
    
    envFiles.forEach(envFile => {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        console.log(`✅ ${envFile} 存在`);
        try {
          const content = fs.readFileSync(envPath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
          console.log(`   - 包含 ${lines.length} 个配置项`);
        } catch (error) {
          console.log(`   - 读取失败: ${error.message}`);
        }
      } else {
        console.log(`❌ ${envFile} 不存在`);
      }
    });
    
    // 检查关键环境变量
    console.log('\n🔑 关键环境变量检查:');
    const requiredEnvVars = [
      'MONGODB_URI',
      'REDIS_HOST',
      'REDIS_PORT',
      'GEMINI_API_KEY',
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LINE_CHANNEL_SECRET'
    ];
    
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`✅ ${envVar}: ${envVar.includes('KEY') || envVar.includes('TOKEN') || envVar.includes('SECRET') ? '***已设置***' : value}`);
      } else {
        console.log(`❌ ${envVar}: 未设置`);
      }
    });
    
    // 检查项目结构
    console.log('\n📁 项目结构检查:');
    const projectPaths = [
      'backend/api/src',
      'backend/api/dist',
      'backend/line/src',
      'frontend/c-end/src',
      'shared/src',
      'package.json',
      'ecosystem.config.js'
    ];
    
    projectPaths.forEach(projectPath => {
      const fullPath = path.join(process.cwd(), projectPath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`✅ ${projectPath} ${stats.isDirectory() ? '(目录)' : '(文件)'}`);
      } else {
        console.log(`❌ ${projectPath} 不存在`);
      }
    });
    
    // 检查package.json依赖
    console.log('\n📦 依赖检查:');
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      
      console.log(`- 生产依赖: ${dependencies.length} 个`);
      console.log(`- 开发依赖: ${devDependencies.length} 个`);
      
      // 检查关键依赖
      const keyDeps = ['mongoose', 'redis', 'express', '@google/generative-ai', '@line/bot-sdk'];
      keyDeps.forEach(dep => {
        if (dependencies.includes(dep)) {
          console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
          console.log(`  ❌ ${dep}: 未安装`);
        }
      });
    }
    
    // 检查编译后的文件
    const distPath = path.join(__dirname, 'dist');
    const srcPath = path.join(__dirname, 'src');
    
    if (fs.existsSync(distPath)) {
      console.log('\n🏗️  编译文件检查:');
      console.log('✅ dist目录存在');
      
      try {
        // 尝试加载配置文件
        const configPaths = [
          path.join(distPath, 'config/database.js'),
          path.join(distPath, 'config/redis.js')
        ];
        
        configPaths.forEach(configPath => {
          if (fs.existsSync(configPath)) {
            console.log(`✅ ${path.basename(configPath)} 配置文件存在`);
          } else {
            console.log(`❌ ${path.basename(configPath)} 配置文件不存在`);
          }
        });
        
      } catch (error) {
        console.log('❌ 加载配置文件失败:', error.message);
      }
      
    } else if (fs.existsSync(srcPath)) {
      console.log('\n🏗️  源码检查:');
      console.log('✅ src目录存在');
      console.log('💡 建议运行: npm run build');
      
    } else {
      console.log('\n❌ 未找到src或dist目录');
    }
    
  } catch (error) {
    console.error('❌ 项目配置检查失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 智能投资助手 - 数据库连接测试工具');
  console.log('=' .repeat(60));
  console.log('版本: 1.0.0');
  console.log('适用环境: Ubuntu 20.04+, macOS 10.15+');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  // 加载环境变量
  try {
    require('dotenv').config();
    console.log('✅ 环境变量已加载');
  } catch (error) {
    console.log('⚠️  未找到dotenv，使用默认配置');
    console.log('💡 建议安装: npm install dotenv');
  }
  
  // 执行所有测试
  const tests = [
    { name: '系统环境检查', func: checkSystemEnvironment },
    { name: 'MongoDB连接测试', func: testMongoDB },
    { name: 'Redis连接测试', func: testRedis },
    { name: '项目配置检查', func: testProjectConfiguration }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`\n${'='.repeat(20)} ${test.name} ${'='.repeat(20)}`);
      const testStartTime = Date.now();
      await test.func();
      const testTime = Date.now() - testStartTime;
      results.push({ name: test.name, status: '✅ 成功', time: testTime });
    } catch (error) {
      console.error(`❌ ${test.name}失败:`, error.message);
      results.push({ name: test.name, status: '❌ 失败', time: 0, error: error.message });
    }
  }
  
  // 生成测试报告
  const totalTime = Date.now() - startTime;
  console.log('\n' + '=' .repeat(60));
  console.log('📊 测试报告');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    console.log(`${result.status} ${result.name} (${result.time}ms)`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  console.log(`\n⏱️  总耗时: ${totalTime}ms`);
  console.log(`📅 测试时间: ${new Date().toLocaleString()}`);
  
  // 提供下一步建议
  const failedTests = results.filter(r => r.status.includes('失败'));
  if (failedTests.length > 0) {
    console.log('\n🔧 故障排除建议:');
    console.log('1. 确保MongoDB和Redis服务正在运行');
    console.log('2. 检查防火墙设置和端口访问权限');
    console.log('3. 验证环境变量配置');
    console.log('4. 查看服务日志文件');
    console.log('\n📚 详细文档: README.md');
  } else {
    console.log('\n🎉 所有测试通过！系统配置正常');
    console.log('💡 现在可以启动应用服务:');
    console.log('   - 开发环境: npm run dev');
    console.log('   - 生产环境: pm2 start ecosystem.config.js');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 测试完成');
}

// 运行测试
main().catch(console.error);