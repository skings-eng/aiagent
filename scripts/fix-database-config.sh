#!/bin/bash

# 修复远程服务器MongoDB中的AI配置
# 解决 "401 OpenAI-Organization header should match organization for API key" 错误

set -e

echo "=== AI配置修复脚本 ==="
echo "此脚本将检查并修复MongoDB中的AI配置"
echo
echo "问题分析："
echo "- aiModels.ts中的loadAIModelConfig函数期望从Settings表中找到特定的AI配置键"
echo "- 但Settings.ts的initializeDefaults方法没有创建这些必需的配置记录"
echo "- 导致API密钥等关键配置缺失，AI功能无法正常工作"
echo

# 检查MongoDB连接
echo "1. 检查MongoDB连接..."
if ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "❌ MongoDB连接失败，请确保MongoDB服务正在运行"
    exit 1
fi
echo "✅ MongoDB连接正常"
echo

# 检查当前AI配置
echo "2. 检查当前AI配置..."
echo "当前Settings表中的AI配置："
mongosh --eval "
const aiSettings = db.settings.find({category: 'ai'}).toArray();
if (aiSettings.length === 0) {
  print('❌ 未找到任何AI配置记录');
} else {
  print('找到 ' + aiSettings.length + ' 条AI配置记录：');
  aiSettings.forEach(doc => {
    const safeDoc = {...doc};
    if (doc.key === 'gpt4o_api_key' && doc.value) {
      safeDoc.value = doc.value.substring(0, 7) + '...' + doc.value.substring(doc.value.length - 4);
    }
    print('- ' + doc.key + ': ' + (doc.value || 'null'));
  });
}

// 检查必需的配置键
const requiredKeys = ['ai_provider', 'gpt4o_api_key', 'gpt4o_model', 'gpt4o_max_tokens', 'gpt4o_temperature'];
const missingKeys = [];
requiredKeys.forEach(key => {
  const setting = db.settings.findOne({category: 'ai', key: key});
  if (!setting || !setting.value) {
    missingKeys.push(key);
  }
});

if (missingKeys.length > 0) {
  print('\n❌ 缺少以下必需的AI配置：');
  missingKeys.forEach(key => print('- ' + key));
} else {
  print('\n✅ 所有必需的AI配置都存在');
}"
echo

# 提示用户输入API密钥
echo "3. 请输入您的OpenAI API密钥："
read -s -p "OpenAI API Key: " OPENAI_API_KEY
echo
echo

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ API密钥不能为空"
    exit 1
fi

# 验证API密钥格式
if [[ ! $OPENAI_API_KEY =~ ^sk-[a-zA-Z0-9]{48,}$ ]]; then
    echo "⚠️  警告：API密钥格式可能不正确，但仍将继续..."
fi

echo "4. 开始修复AI配置..."
echo "   正在创建/更新必需的AI配置记录..."

# 使用mongosh执行修复脚本
mongosh --eval "
// 创建临时ObjectId和时间戳
const userId = new ObjectId('000000000000000000000000');
const currentTime = new Date();
const apiKey = '$OPENAI_API_KEY';

// 定义必需的AI配置
const aiConfigs = [
  {
    category: 'ai',
    key: 'ai_provider',
    value: 'openai',
    type: 'string',
    description: 'AI service provider (openai, anthropic, google)',
    isPublic: false,
    isEditable: true,
    metadata: {
      group: 'ai',
      sensitive: false,
      restartRequired: false
    }
  },
  {
    category: 'ai',
    key: 'gpt4o_api_key',
    value: apiKey,
    type: 'string',
    description: 'AI API key for chat functionality',
    isPublic: false,
    isEditable: true,
    metadata: {
      group: 'ai',
      sensitive: true,
      restartRequired: false
    }
  },
  {
    category: 'ai',
    key: 'gpt4o_model',
    value: 'gpt-4o',
    type: 'string',
    description: 'AI model version',
    isPublic: false,
    isEditable: true,
    metadata: {
      group: 'ai'
    }
  },
  {
    category: 'ai',
    key: 'gpt4o_max_tokens',
    value: 4096,
    type: 'number',
    description: 'AI maximum output tokens',
    isPublic: false,
    isEditable: true,
    metadata: {
      group: 'ai'
    }
  },
  {
    category: 'ai',
    key: 'gpt4o_temperature',
    value: 0.7,
    type: 'number',
    description: 'AI temperature parameter',
    isPublic: false,
    isEditable: true,
    metadata: {
      group: 'ai'
    }
  }
];

// 逐个创建或更新配置
let successCount = 0;
let errorCount = 0;

aiConfigs.forEach(config => {
  try {
    const result = db.settings.updateOne(
      { category: config.category, key: config.key },
      {
        \$set: {
          value: config.value,
          type: config.type,
          description: config.description,
          isPublic: config.isPublic,
          isEditable: config.isEditable,
          metadata: config.metadata,
          updatedBy: userId,
          updatedAt: currentTime
        },
        \$setOnInsert: {
          category: config.category,
          key: config.key,
          createdBy: userId,
          createdAt: currentTime,
          history: []
        }
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      print('✅ 创建配置: ' + config.key);
    } else if (result.modifiedCount > 0) {
      print('✅ 更新配置: ' + config.key);
    } else {
      print('ℹ️  配置已存在且无需更新: ' + config.key);
    }
    successCount++;
  } catch (error) {
    print('❌ 处理配置失败 ' + config.key + ': ' + error.message);
    errorCount++;
  }
});

print('\n配置处理完成：');
print('- 成功: ' + successCount + ' 项');
print('- 失败: ' + errorCount + ' 项');
"

echo "✅ AI配置修复完成"
echo

# 重启PM2服务
echo "5. 重启PM2服务..."
if command -v pm2 > /dev/null 2>&1; then
    pm2 restart all
    echo "✅ PM2服务重启完成"
else
    echo "⚠️  PM2未找到，请手动重启应用服务"
fi
echo

# 验证修复结果
echo "6. 验证修复结果..."
echo "修复后的AI配置："
mongosh --eval "
const aiSettings = db.settings.find({category: 'ai'}).toArray();
print('找到 ' + aiSettings.length + ' 条AI配置记录：');
aiSettings.forEach(doc => {
  let displayValue = doc.value;
  if (doc.key === 'gpt4o_api_key' && doc.value) {
    displayValue = doc.value.substring(0, 7) + '...' + doc.value.substring(doc.value.length - 4);
  }
  print('- ' + doc.key + ': ' + displayValue + ' (' + doc.type + ')');
});

// 再次检查必需的配置键
const requiredKeys = ['ai_provider', 'gpt4o_api_key', 'gpt4o_model', 'gpt4o_max_tokens', 'gpt4o_temperature'];
const stillMissingKeys = [];
requiredKeys.forEach(key => {
  const setting = db.settings.findOne({category: 'ai', key: key});
  if (!setting || !setting.value) {
    stillMissingKeys.push(key);
  }
});

if (stillMissingKeys.length === 0) {
  print('\n✅ 所有必需的AI配置现在都已正确设置');
} else {
  print('\n❌ 仍然缺少以下配置：');
  stillMissingKeys.forEach(key => print('- ' + key));
}"
echo

echo "=== 修复完成 ==="
echo "请访问 http://your-server:3000/chat 测试聊天功能"
echo "如果仍有问题，请检查PM2日志：pm2 logs aiagent-api"