#!/usr/bin/env node

/**
 * 重置频率限制的工具脚本
 * 使用方法: node resetRateLimit.js [ip地址或用户ID]
 */

const redis = require('redis');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

async function resetRateLimit(identifier) {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('已连接到Redis');

    // 定义所有可能的频率限制前缀
    const prefixes = [
      'rl:general:',
      'rl:auth:',
      'rl:api:',
      'rl:ai:',
      'rl:upload:',
      'rl:admin:',
      'rl:search:',
      'rl:export:',
      'rl:password-reset:'
    ];

    if (identifier) {
      // 重置特定IP或用户的频率限制
      console.log(`正在重置 ${identifier} 的频率限制...`);
      
      for (const prefix of prefixes) {
        const ipKey = `${prefix}ip:${identifier}`;
        const userKey = `${prefix}user:${identifier}`;
        
        await client.del(ipKey);
        await client.del(userKey);
        console.log(`已重置: ${ipKey} 和 ${userKey}`);
      }
    } else {
      // 重置所有频率限制
      console.log('正在重置所有频率限制...');
      
      for (const prefix of prefixes) {
        const keys = await client.keys(`${prefix}*`);
        if (keys.length > 0) {
          await client.del(keys);
          console.log(`已删除 ${keys.length} 个 ${prefix} 相关的键`);
        }
      }
    }

    console.log('频率限制重置完成!');
  } catch (error) {
    console.error('重置频率限制时出错:', error);
  } finally {
    await client.quit();
  }
}

// 获取命令行参数
const identifier = process.argv[2];

if (identifier) {
  console.log(`重置特定标识符的频率限制: ${identifier}`);
} else {
  console.log('重置所有频率限制');
}

resetRateLimit(identifier);