module.exports = {
  apps: [
    {
      name: 'aiagent-api',
      script: './backend/api/dist/server.js',
      cwd: process.env.PROJECT_ROOT || '/Users/sking/aiagent',
      env: {
        NODE_ENV: 'production',
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
      cwd: process.env.PROJECT_ROOT || '/Users/sking/aiagent',
      env: {
        NODE_ENV: 'production',
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
      args: 'run dev',
      cwd: (process.env.PROJECT_ROOT || '/Users/sking/aiagent') + '/frontend/b-end',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
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
      cwd: process.env.PROJECT_ROOT || '/Users/sking/aiagent',
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
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'your-repository-url',
      path: '/opt/aiagent',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};