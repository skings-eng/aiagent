module.exports = {
  apps: [
    {
      name: 'aiagent-api',
      script: './backend/api/dist/server.js',
      cwd: '/Users/kencode/mac/vuedev/aiagent',
      env: {
        NODE_ENV: 'development',
        PORT: 8001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },

    {
      name: 'aiagent-line',
      script: './backend/line/dist/index.js',
      cwd: '/Users/kencode/mac/vuedev/aiagent',
      env: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/line-error.log',
      out_file: './logs/line-out.log',
      log_file: './logs/line-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },

    {
      name: 'aiagent-frontend',
      script: 'npm',
      args: 'run preview -- --port 3000 --host 0.0.0.0',
      cwd: '/Users/kencode/mac/vuedev/aiagent/frontend/b-end',
      env: {
        NODE_ENV: 'development'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },

    {
      name: 'aiagent-mcp',
      script: './backend/api/mcp-yfinance-server/start_mcp.sh',
      cwd: '/Users/kencode/mac/vuedev/aiagent',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      error_file: './logs/mcp-error.log',
      out_file: './logs/mcp-out.log',
      log_file: './logs/mcp-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
