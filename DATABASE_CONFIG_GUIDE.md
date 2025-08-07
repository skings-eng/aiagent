# 数据库配置指南

## 数据库名称说明

本项目在不同环境下使用不同的数据库名称，请根据您的部署环境选择正确的配置：

### 🔧 环境对应的数据库名称

| 环境 | 数据库名称 | 配置文件 | 说明 |
|------|------------|----------|------|
| **开发环境** | `japan-stock-ai` | `backend/api/.env` | 本地开发使用 |
| **生产环境** | `japan_stock_ai_prod` | `backend/api/.env.production` | 官方生产环境 |
| **Ubuntu部署** | `aiagent_prod` | `backend/api/.env` | 用户自建服务器 |
| **测试环境** | `japan_stock_ai_test` | `backend/api/.env.test` | 自动化测试使用 |

### 📝 配置示例

#### Ubuntu服务器部署（推荐）
```bash
# backend/api/.env
MONGODB_URI=mongodb://localhost:27017/aiagent_prod
```

#### 本地开发环境
```bash
# backend/api/.env
MONGODB_URI=mongodb://localhost:27017/japan-stock-ai
```

#### 官方生产环境
```bash
# backend/api/.env.production
MONGODB_URI=mongodb://localhost:27017/japan_stock_ai_prod
```

### 🚨 常见问题

#### 问题1：Gemini API Key无法保存
**原因：** 数据库名称配置错误，导致无法连接到正确的数据库

**解决方案：**
1. 检查您的环境变量文件中的 `MONGODB_URI`
2. 确保数据库名称与您的部署环境匹配
3. 运行快速修复脚本：`./quick-fix-gemini.sh`

#### 问题2：数据库连接失败
**原因：** 使用了错误的数据库名称或数据库不存在

**解决方案：**
```bash
# 1. 检查MongoDB服务状态
sudo systemctl status mongod

# 2. 连接到MongoDB并创建数据库
mongosh
use aiagent_prod
db.test.insertOne({test: "init"})
db.test.deleteOne({test: "init"})
exit

# 3. 重启服务
pm2 restart all
```

#### 问题3：配置文件中的数据库名称不匹配
**解决方案：**
```bash
# 检查当前配置
grep MONGODB_URI backend/api/.env

# 修改为正确的数据库名称
sed -i 's/japan-stock-ai/aiagent_prod/g' backend/api/.env
sed -i 's/japan_stock_ai_prod/aiagent_prod/g' backend/api/.env
```

### 🔄 数据库迁移

如果您需要从一个数据库迁移到另一个数据库：

#### 方法1：使用mongodump和mongorestore
```bash
# 导出旧数据库
mongodump --db japan-stock-ai --out backup/

# 导入到新数据库
mongorestore --db aiagent_prod backup/japan-stock-ai/
```

#### 方法2：使用MongoDB Compass
1. 连接到MongoDB
2. 选择源数据库
3. 导出集合
4. 切换到目标数据库
5. 导入集合

### 🛠️ 自动修复工具

我们提供了自动修复工具来解决数据库配置问题：

#### 快速修复（推荐）
```bash
./quick-fix-gemini.sh
```

#### 详细诊断
```bash
node diagnose-gemini-issue.js
```

#### 交互式修复
```bash
node fix-gemini-config.js
```

### 📋 检查清单

在部署前，请确认以下配置：

- [ ] MongoDB服务正在运行
- [ ] 环境变量文件存在：`backend/api/.env`
- [ ] `MONGODB_URI` 配置正确
- [ ] 数据库名称与部署环境匹配
- [ ] 数据库具有读写权限
- [ ] 防火墙允许MongoDB端口（27017）

### 🔍 验证配置

运行以下命令验证数据库配置：

```bash
# 1. 检查环境变量
cd backend/api
node -e "require('dotenv').config(); console.log('MONGODB_URI:', process.env.MONGODB_URI);"

# 2. 测试数据库连接
node test-db-connection.js

# 3. 检查Gemini配置
node check_gemini_config.js
```

### 📞 获取帮助

如果您仍然遇到数据库配置问题：

1. 运行完整诊断：`node diagnose-gemini-issue.js`
2. 查看详细日志：`pm2 logs`
3. 检查MongoDB日志：`sudo tail -f /var/log/mongodb/mongod.log`
4. 参考故障排查文档：`GEMINI_CONFIG_TROUBLESHOOTING.md`

---

**重要提醒：** 请确保在修改数据库配置前备份您的数据，避免数据丢失。