#!/bin/bash

# 数据库初始化脚本

echo "正在初始化MongoDB数据库..."

if command -v mongosh &> /dev/null; then
    mongosh --host localhost:27017 "/root/aiagent/scripts/init-database.js"
elif command -v mongo &> /dev/null; then
    mongo --host localhost:27017 "/root/aiagent/scripts/init-database.js"
else
    echo "错误: 未找到MongoDB客户端 (mongosh 或 mongo)"
    exit 1
fi

echo "数据库初始化完成！"
