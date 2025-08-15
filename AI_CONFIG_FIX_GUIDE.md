# AI配置问题修复指南

## 问题诊断

经过深入分析，远程服务器上出现 `401 OpenAI-Organization header should match organization for API key` 错误的根本原因是：

### 1. 系统架构变更
- **旧版本**: AI API密钥通过环境变量配置
- **新版本**: AI API密钥从MongoDB数据库的Settings表中获取
- **问题**: 远程服务器的数据库中缺少正确的AI配置

### 2. 具体问题
1. **数据库配置缺失**: MongoDB中没有正确的AI配置记录
2. **API密钥未设置**: `gpt4o_api_key` 在数据库中不存在或为空
3. **提供商未配置**: `ai_provider` 设置缺失
4. **模型参数缺失**: 相关的模型配置参数未正确设置

## 解决方案

### 方案一：使用自动修复脚本（推荐）

1. **上传修复脚本到远程服务器**:
   ```bash
   scp scripts/fix-database-config.sh user@your-server:/root/aiagent/
   ```

2. **在远程服务器上执行**:
   ```bash
   cd /root/aiagent
   chmod +x fix-database-config.sh
   ./fix-database-config.sh
   ```

3. **按提示输入OpenAI API密钥**

### 方案二：手动修复数据库

1. **连接到远程服务器的MongoDB**:
   ```bash
   mongosh aiagent
   ```

2. **插入AI配置**:
   ```javascript
   // 设置AI提供商
   db.settings.replaceOne(
     {category: 'ai', key: 'ai_provider'},
     {
       category: 'ai',
       key: 'ai_provider',
       value: 'openai',
       type: 'string',
       description: 'AI service provider',
       isPublic: false,
       isEditable: true,
       createdAt: new Date(),
       updatedAt: new Date()
     },
     {upsert: true}
   );
   
   // 设置API密钥（替换YOUR_ACTUAL_API_KEY）
   db.settings.replaceOne(
     {category: 'ai', key: 'gpt4o_api_key'},
     {
       category: 'ai',
       key: 'gpt4o_api_key',
       value: 'YOUR_ACTUAL_API_KEY',
       type: 'string',
       description: 'OpenAI API key',
       isPublic: false,
       isEditable: true,
       createdAt: new Date(),
       updatedAt: new Date()
     },
     {upsert: true}
   );
   
   // 设置默认模型
   db.settings.replaceOne(
     {category: 'ai', key: 'gpt4o_model'},
     {
       category: 'ai',
       key: 'gpt4o_model',
       value: 'gpt-4o',
       type: 'string',
       description: 'AI model version',
       isPublic: false,
       isEditable: true,
       createdAt: new Date(),
       updatedAt: new Date()
     },
     {upsert: true}
   );
   ```

3. **重启服务**:
   ```bash
   pm2 restart aiagent-api
   ```

### 方案三：通过前端界面配置

1. **访问AI配置页面**: `http://your-server:3000/ai-config`
2. **输入正确的API密钥和配置**
3. **点击"测试连接"验证**
4. **点击"保存配置"**

## 验证修复结果

### 1. 检查数据库配置
```bash
mongosh aiagent --eval "db.settings.find({category: 'ai'}).pretty()"
```

### 2. 检查API服务日志
```bash
pm2 logs aiagent-api
```

### 3. 测试聊天功能
- 访问: `http://your-server:3000/chat`
- 发送测试消息
- 检查是否有API错误

## 预防措施

### 1. 部署脚本优化
- 确保部署脚本包含数据库初始化逻辑
- 添加AI配置的默认值设置

### 2. 监控和告警
- 添加AI API连接状态监控
- 设置配置缺失告警

### 3. 文档更新
- 更新部署文档，说明新的配置方式
- 添加故障排除指南

## 常见问题

### Q: 为什么环境变量中的API密钥不生效？
A: 新版本系统已改为从数据库获取配置，环境变量中的配置不再使用。

### Q: 如何确认API密钥格式正确？
A: OpenAI API密钥应以 `sk-` 开头，长度通常为51个字符。

### Q: 修复后仍然报错怎么办？
A: 检查API密钥是否有效，确认网络连接正常，查看详细的错误日志。

## 联系支持

如果按照以上步骤仍无法解决问题，请提供：
1. 详细的错误日志
2. 数据库配置截图
3. 系统环境信息