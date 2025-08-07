#!/usr/bin/env node

/**
 * Gemini API Key 配置自动修复脚本
 * 用于自动解决Ubuntu环境中的常见配置问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

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

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

class GeminiFixer {
  constructor() {
    this.fixes = [];
  }

  addFix(description) {
    this.fixes.push(description);
  }

  // 1. 修复系统服务
  async fixSystemServices() {
    log('\n🔧 检查并修复系统服务...', 'cyan');
    
    const services = ['mongod', 'redis', 'redis-server'];
    
    for (const service of services) {
      try {
        const status = execSync(`systemctl is-active ${service} 2>/dev/null || echo "inactive"`, 
          { encoding: 'utf8' }).trim();
        
        if (status !== 'active') {
          const shouldFix = await askQuestion(`${service} 服务未运行，是否启动？ (y/n): `);
          
          if (shouldFix.toLowerCase() === 'y') {
            try {
              execSync(`sudo systemctl start ${service}`, { stdio: 'inherit' });
              execSync(`sudo systemctl enable ${service}`, { stdio: 'inherit' });
              success(`${service} 服务已启动并设置为开机自启`);
              this.addFix(`启动了 ${service} 服务`);
            } catch (err) {
              error(`启动 ${service} 服务失败: ${err.message}`);
            }
          }
        } else {
          success(`${service} 服务运行正常`);
        }
      } catch (err) {
        warning(`无法检查 ${service} 服务状态`);
      }
    }
  }

  // 2. 创建环境变量文件
  async createEnvironmentFile() {
    log('\n🔧 检查并创建环境变量文件...', 'cyan');
    
    const envPath = 'backend/api/.env';
    
    if (!fs.existsSync(envPath)) {
      const shouldCreate = await askQuestion('环境变量文件不存在，是否创建？ (y/n): ');
      
      if (shouldCreate.toLowerCase() === 'y') {
        const apiKey = await askQuestion('请输入您的Google AI API Key: ');
        
        if (!apiKey) {
          error('API Key不能为空');
          return;
        }
        
        const serverIP = await askQuestion('请输入服务器IP地址 (默认: localhost): ') || 'localhost';
        
        const envContent = `# 生产环境配置
NODE_ENV=production
PORT=3001
SERVER_HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/japan-stock-ai
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS配置
FRONTEND_URL=http://${serverIP}:4173
ALLOWED_ORIGINS=http://${serverIP}:4173,http://localhost:4173

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-${Date.now()}
JWT_EXPIRES_IN=7d

# AI API密钥
GOOGLE_AI_API_KEY=${apiKey}

# 日志配置
LOG_LEVEL=info
`;
        
        try {
          // 确保目录存在
          const envDir = path.dirname(envPath);
          if (!fs.existsSync(envDir)) {
            fs.mkdirSync(envDir, { recursive: true });
          }
          
          fs.writeFileSync(envPath, envContent);
          success('环境变量文件创建成功');
          this.addFix('创建了环境变量文件');
        } catch (err) {
          error(`创建环境变量文件失败: ${err.message}`);
        }
      }
    } else {
      success('环境变量文件已存在');
      
      // 检查API Key是否设置
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasApiKey = envContent.includes('GOOGLE_AI_API_KEY=') && 
                       !envContent.includes('GOOGLE_AI_API_KEY=your-') &&
                       !envContent.includes('GOOGLE_AI_API_KEY=AIzaSyCAWckxmtKkHq4ELpEkvViz4bsLUc2SOHw');
      
      if (!hasApiKey) {
        const shouldUpdate = await askQuestion('API Key未正确设置，是否更新？ (y/n): ');
        
        if (shouldUpdate.toLowerCase() === 'y') {
          const apiKey = await askQuestion('请输入您的Google AI API Key: ');
          
          if (apiKey) {
            try {
              let updatedContent = envContent;
              
              if (updatedContent.includes('GOOGLE_AI_API_KEY=')) {
                updatedContent = updatedContent.replace(
                  /GOOGLE_AI_API_KEY=.*/,
                  `GOOGLE_AI_API_KEY=${apiKey}`
                );
              } else {
                updatedContent += `\nGOOGLE_AI_API_KEY=${apiKey}\n`;
              }
              
              fs.writeFileSync(envPath, updatedContent);
              success('API Key已更新');
              this.addFix('更新了API Key配置');
            } catch (err) {
              error(`更新API Key失败: ${err.message}`);
            }
          }
        }
      }
    }
  }

  // 3. 构建项目
  async buildProject() {
    log('\n🔧 检查并构建项目...', 'cyan');
    
    const distPath = 'backend/api/dist';
    
    if (!fs.existsSync(distPath)) {
      const shouldBuild = await askQuestion('项目未构建，是否现在构建？ (y/n): ');
      
      if (shouldBuild.toLowerCase() === 'y') {
        try {
          info('安装依赖...');
          execSync('npm install', { stdio: 'inherit', cwd: 'backend/api' });
          
          info('构建项目...');
          execSync('npm run build', { stdio: 'inherit', cwd: 'backend/api' });
          
          success('项目构建完成');
          this.addFix('构建了后端项目');
        } catch (err) {
          error(`项目构建失败: ${err.message}`);
        }
      }
    } else {
      success('项目已构建');
    }
  }

  // 4. 初始化数据库配置
  async initializeDatabaseConfig() {
    log('\n🔧 初始化数据库配置...', 'cyan');
    
    try {
      // 加载环境变量
      require('dotenv').config({ path: 'backend/api/.env' });
      
      const mongoose = require('mongoose');
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/japan-stock-ai';
      
      info(`连接数据库: ${MONGODB_URI}`);
      
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });
      
      success('数据库连接成功');
      
      // 检查Settings模型
      try {
        const { Settings } = require('./backend/api/dist/models/Settings');
        
        // 检查是否已有Gemini配置
        const existingSetting = await Settings.getByKey('ai', 'gemini_api_key');
        
        if (!existingSetting) {
          const apiKey = process.env.GOOGLE_AI_API_KEY;
          
          if (apiKey && apiKey !== 'your-google-ai-api-key') {
            const shouldInit = await askQuestion('是否将环境变量中的API Key保存到数据库？ (y/n): ');
            
            if (shouldInit.toLowerCase() === 'y') {
              const userObjectId = new mongoose.Types.ObjectId();
              
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
              
              success('Gemini API Key已保存到数据库');
              this.addFix('初始化了数据库中的Gemini配置');
            }
          } else {
            warning('环境变量中的API Key无效，请先配置正确的API Key');
          }
        } else {
          success('数据库中已存在Gemini配置');
          info(`API Key长度: ${existingSetting.value.length} 字符`);
        }
      } catch (err) {
        error(`Settings模型操作失败: ${err.message}`);
      }
      
      await mongoose.disconnect();
      
    } catch (err) {
      error(`数据库操作失败: ${err.message}`);
    }
  }

  // 5. 重启服务
  async restartServices() {
    log('\n🔧 重启服务...', 'cyan');
    
    const shouldRestart = await askQuestion('是否重启PM2服务以应用配置？ (y/n): ');
    
    if (shouldRestart.toLowerCase() === 'y') {
      try {
        info('重启PM2服务...');
        
        // 停止现有服务
        try {
          execSync('pm2 stop all', { stdio: 'inherit' });
        } catch (err) {
          // 忽略停止错误
        }
        
        // 启动服务
        execSync('./start-services.sh', { stdio: 'inherit' });
        
        success('服务重启完成');
        this.addFix('重启了PM2服务');
        
        // 显示服务状态
        setTimeout(() => {
          try {
            execSync('pm2 status', { stdio: 'inherit' });
          } catch (err) {
            // 忽略错误
          }
        }, 2000);
        
      } catch (err) {
        error(`重启服务失败: ${err.message}`);
      }
    }
  }

  // 6. 生成修复报告
  generateReport() {
    log('\n📋 修复报告', 'magenta');
    
    if (this.fixes.length === 0) {
      info('未执行任何修复操作');
    } else {
      success(`完成了 ${this.fixes.length} 项修复:`);
      this.fixes.forEach((fix, index) => {
        log(`  ${index + 1}. ${fix}`, 'green');
      });
    }
    
    log('\n🔍 建议接下来执行以下操作:', 'yellow');
    log('  1. 运行诊断脚本: node diagnose-gemini-issue.js', 'yellow');
    log('  2. 检查服务状态: pm2 status', 'yellow');
    log('  3. 查看服务日志: pm2 logs', 'yellow');
    log('  4. 测试API: curl http://localhost:3001/api/ai-models/gemini/status', 'yellow');
  }

  // 运行完整修复
  async runFix() {
    log('🔧 开始Gemini API Key配置自动修复...', 'cyan');
    log('=' * 50, 'cyan');
    
    try {
      await this.fixSystemServices();
      await this.createEnvironmentFile();
      await this.buildProject();
      await this.initializeDatabaseConfig();
      await this.restartServices();
      
      this.generateReport();
      
      log('\n✅ 修复完成！', 'green');
      
    } catch (error) {
      error(`修复过程中发生错误: ${error.message}`);
    } finally {
      rl.close();
    }
  }
}

// 主函数
async function main() {
  try {
    const fixer = new GeminiFixer();
    await fixer.runFix();
  } catch (error) {
    error(`修复过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = GeminiFixer;