#!/bin/bash

# Test PM2 configuration generation
echo "Testing PM2 configuration generation..."

# Set test variables (simulating Ubuntu environment)
PROJECT_DIR="/home/ubuntu/aiagent"
API_PORT="3001"
FRONTEND_PORT="4173"
LINE_PORT="3003"

# Generate PM2 config
cat > test-ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'aiagent-api',
      script: './backend/api/dist/server.js',
      cwd: '${PROJECT_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: ${API_PORT}
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/aiagent/api-error.log',
      out_file: '/var/log/aiagent/api-out.log',
      log_file: '/var/log/aiagent/api.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiagent-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '${PROJECT_DIR}/frontend/b-end',
      env: {
        NODE_ENV: 'production',
        PORT: ${FRONTEND_PORT},
        HOST: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      error_file: '/var/log/aiagent/frontend-error.log',
      out_file: '/var/log/aiagent/frontend-out.log',
      log_file: '/var/log/aiagent/frontend.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aiagent-line',
      script: './backend/line/dist/index.js',
      cwd: '${PROJECT_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: ${LINE_PORT}
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/aiagent/line-error.log',
      out_file: '/var/log/aiagent/line-out.log',
      log_file: '/var/log/aiagent/line.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

echo "Generated PM2 config:"
cat test-ecosystem.config.js

echo ""
echo "Testing path resolution:"
echo "API script path: ${PROJECT_DIR}/backend/api/dist/server.js"
echo "LINE script path: ${PROJECT_DIR}/backend/line/dist/index.js"
echo "Frontend working directory: ${PROJECT_DIR}/frontend/b-end"

# Simulate file existence check
echo ""
echo "Simulating file existence check on Ubuntu server:"
echo "Checking if /home/ubuntu/aiagent/backend/api/dist/server.js would exist..."
echo "Checking if /home/ubuntu/aiagent/backend/line/dist/index.js would exist..."
echo "Checking if /home/ubuntu/aiagent/frontend/b-end/package.json would exist..."

# Clean up
rm -f test-ecosystem.config.js

echo ""
echo "Test completed. The issue might be:"
echo "1. Build files not generated on Ubuntu server"
echo "2. PM2 working directory mismatch"
echo "3. File permissions on Ubuntu server"
echo "4. Node.js/npm not properly installed on Ubuntu server"