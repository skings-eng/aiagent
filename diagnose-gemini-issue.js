#!/usr/bin/env node

/**
 * Gemini API Key 配置问题诊断脚本
 * 用于快速定位Ubuntu环境中的配置问题
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const https = require('https');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class GeminiDiagnostic {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  addIssue(issue) {
    this.issues.push(issue);
  }

  addRecommendation(recommendation) {
    this.recommendations.push(recommendation);
  }

  // 1. 检查系统环境
  checkSystemEnvironment() {
    log('\n🔍 检查系统环境...', 'cyan');
    
    try {
      const platform = os.platform();
      const arch = os.arch();
      const nodeVersion = process.version;
      
      info(`操作系统: ${platform} ${arch}`);
      info(`Node.js版本: ${nodeVersion}`);
      
      if (platform !== 'linux') {
        warning('当前不是Linux环境，某些检查可能不适用');
      }
      
      // 检查内存
      const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);
      info(`内存: ${freeMem}GB 可用 / ${totalMem}GB 总计`);
      
      if (freeMem < 1) {
        this.addIssue('可用内存不足1GB，可能影响数据库性能');
        this.addRecommendation('考虑释放内存或增加交换空间');
      }
      
    } catch (err) {
      error(`系统环境检查失败: ${err.message}`);
      this.addIssue('无法获取系统信息');
    }
  }

  // 2. 检查服务状态
  checkServices() {
    log('\n🔍 检查系统服务...', 'cyan');
    
    const services = ['mongod', 'redis', 'redis-server'];
    
    services.forEach(service => {
      try {
        if (os.platform() === 'linux') {
          const status = execSync(`systemctl is-active ${service} 2>/dev/null || echo "inactive"`, 
            { encoding: 'utf8' }).trim();
          
          if (status === 'active') {
            success(`${service} 服务运行中`);
          } else {
            error(`${service} 服务未运行`);
            this.addIssue(`${service} 服务未启动`);
            this.addRecommendation(`启动服务: sudo systemctl start ${service}`);
          }
        }
      } catch (err) {
        warning(`无法检查 ${service} 服务状态`);
      }
    });
  }

  // 3. 检查端口占用
  checkPorts() {
    log('\n🔍 检查端口占用...', 'cyan');
    
    const ports = {
      27017: 'MongoDB',
      6379: 'Redis',
      3001: 'API服务器',
      4173: '前端服务器'
    };
    
    Object.entries(ports).forEach(([port, service]) => {
      try {
        let cmd;
        if (os.platform() === 'linux') {
          cmd = `netstat -tlnp 2>/dev/null | grep :${port} || echo "not found"`;
        } else {
          cmd = `lsof -i :${port} 2>/dev/null || echo "not found"`;
        }
        
        const result = execSync(cmd, { encoding: 'utf8' }).trim();
        
        if (result && result !== 'not found') {
          success(`端口 ${port} (${service}) 已占用`);
        } else {
          warning(`端口 ${port} (${service}) 未占用`);
          if (port === '27017' || port === '6379') {
            this.addIssue(`${service} 可能未运行 (端口 ${port} 未占用)`);
          }
        }
      } catch (err) {
        warning(`无法检查端口 ${port}`);
      }
    });
  }

  // 4. 检查项目文件
  checkProjectFiles() {
    log('\n🔍 检查项目文件...', 'cyan');
    
    const requiredFiles = [
      'backend/api/.env',
      'backend/api/.env.production',
      'backend/api/package.json',
      'backend/api/dist',
      'package.json'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.resolve(file);
      if (fs.existsSync(filePath)) {
        success(`文件存在: ${file}`);
      } else {
        error(`文件缺失: ${file}`);
        this.addIssue(`缺少必要文件: ${file}`);
        
        if (file.includes('.env')) {
          this.addRecommendation(`创建环境变量文件: ${file}`);
        } else if (file === 'backend/api/dist') {
          this.addRecommendation('运行构建命令: cd backend/api && npm run build');
        }
      }
    });
  }

  // 5. 检查环境变量
  checkEnvironmentVariables() {
    log('\n🔍 检查环境变量...', 'cyan');
    
    // 尝试加载环境变量
    const envFiles = [
      'backend/api/.env',
      'backend/api/.env.production'
    ];
    
    let envLoaded = false;
    
    envFiles.forEach(envFile => {
      if (fs.existsSync(envFile)) {
        try {
          const envContent = fs.readFileSync(envFile, 'utf8');
          const lines = envContent.split('\n');
          
          info(`检查 ${envFile}:`);
          
          const requiredVars = [
            'MONGODB_URI',
            'GOOGLE_AI_API_KEY',
            'NODE_ENV',
            'PORT'
          ];
          
          requiredVars.forEach(varName => {
            const found = lines.find(line => line.startsWith(`${varName}=`));
            if (found) {
              const value = found.split('=')[1];
              if (value && value.trim() !== '') {
                if (varName === 'GOOGLE_AI_API_KEY') {
                  success(`${varName}: 已设置 (${value.length} 字符)`);
                } else {
                  success(`${varName}: ${value}`);
                }
              } else {
                error(`${varName}: 值为空`);
                this.addIssue(`环境变量 ${varName} 值为空`);
              }
            } else {
              error(`${varName}: 未设置`);
              this.addIssue(`缺少环境变量: ${varName}`);
            }
          });
          
          envLoaded = true;
        } catch (err) {
          error(`无法读取 ${envFile}: ${err.message}`);
        }
      }
    });
    
    if (!envLoaded) {
      this.addIssue('无法找到有效的环境变量文件');
      this.addRecommendation('创建并配置 backend/api/.env 文件');
    }
  }

  // 6. 测试数据库连接
  async testDatabaseConnection() {
    log('\n🔍 测试数据库连接...', 'cyan');
    
    try {
      // 加载环境变量
      require('dotenv').config({ path: 'backend/api/.env' });
      
      const mongoose = require('mongoose');
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiagent_prod';
      
      info(`连接URI: ${MONGODB_URI}`);
      
      const startTime = Date.now();
      
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });
      
      const connectTime = Date.now() - startTime;
      success(`MongoDB连接成功 (耗时: ${connectTime}ms)`);
      
      // 测试Settings模型
      try {
        const { Settings } = require('./backend/api/dist/models/Settings');
        const testSetting = await Settings.getByKey('ai', 'gemini_api_key');
        
        if (testSetting) {
          success('Settings模型工作正常，找到现有配置');
          info(`API Key长度: ${testSetting.value ? testSetting.value.length : 0} 字符`);
        } else {
          warning('Settings模型工作正常，但未找到Gemini配置');
          this.addRecommendation('需要初始化Gemini API Key配置');
        }
      } catch (err) {
        error(`Settings模型测试失败: ${err.message}`);
        this.addIssue('Settings模型无法正常工作');
        this.addRecommendation('检查后端代码是否正确构建');
      }
      
      await mongoose.disconnect();
      
    } catch (err) {
      error(`MongoDB连接失败: ${err.message}`);
      this.addIssue('MongoDB连接失败');
      
      if (err.message.includes('ECONNREFUSED')) {
        this.addRecommendation('MongoDB服务未运行，执行: sudo systemctl start mongod');
      } else if (err.message.includes('authentication')) {
        this.addRecommendation('检查MongoDB认证配置');
      } else {
        this.addRecommendation('检查MongoDB配置和网络连接');
      }
    }
  }

  // 7. 测试网络连接
  async testNetworkConnection() {
    log('\n🔍 测试网络连接...', 'cyan');
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: '/v1beta/models',
        method: 'GET',
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          success('Google AI API 网络连接正常');
        } else {
          warning(`Google AI API 返回状态码: ${res.statusCode}`);
        }
        resolve();
      });
      
      req.on('error', (err) => {
        error(`Google AI API 网络连接失败: ${err.message}`);
        this.addIssue('无法连接到Google AI API');
        this.addRecommendation('检查网络连接和防火墙设置');
        resolve();
      });
      
      req.on('timeout', () => {
        error('Google AI API 连接超时');
        this.addIssue('Google AI API 连接超时');
        this.addRecommendation('检查网络连接速度');
        resolve();
      });
      
      req.end();
    });
  }

  // 8. 生成诊断报告
  generateReport() {
    log('\n📋 诊断报告', 'magenta');
    
    if (this.issues.length === 0) {
      success('未发现明显问题！');
    } else {
      error(`发现 ${this.issues.length} 个问题:`);
      this.issues.forEach((issue, index) => {
        log(`  ${index + 1}. ${issue}`, 'red');
      });
    }
    
    if (this.recommendations.length > 0) {
      log('\n💡 建议解决方案:', 'yellow');
      this.recommendations.forEach((rec, index) => {
        log(`  ${index + 1}. ${rec}`, 'yellow');
      });
    }
    
    log('\n📝 详细故障排除指南请查看: GEMINI_CONFIG_TROUBLESHOOTING.md', 'blue');
  }

  // 运行完整诊断
  async runDiagnostic() {
    log('🚀 开始Gemini API Key配置诊断...', 'cyan');
    log('=' * 50, 'cyan');
    
    this.checkSystemEnvironment();
    this.checkServices();
    this.checkPorts();
    this.checkProjectFiles();
    this.checkEnvironmentVariables();
    
    await this.testDatabaseConnection();
    await this.testNetworkConnection();
    
    this.generateReport();
    
    log('\n✅ 诊断完成！', 'green');
  }
}

// 主函数
async function main() {
  try {
    const diagnostic = new GeminiDiagnostic();
    await diagnostic.runDiagnostic();
  } catch (error) {
    error(`诊断过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = GeminiDiagnostic;