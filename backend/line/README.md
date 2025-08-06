# AI Agent LINE Bot Service

A comprehensive LINE Bot service module for the AI Agent platform, built with TypeScript, Express, and Redis.

## Features

- 🤖 **LINE Bot Integration**: Complete LINE Messaging API support
- 📨 **Message Handling**: Text, image, sticker, and rich message support
- 👥 **User Management**: User profiles, settings, and activity tracking
- 🔄 **Webhook Processing**: Real-time event handling with validation
- 📊 **Analytics**: Message and user analytics with caching
- 🚀 **High Performance**: Redis caching and rate limiting
- 🔒 **Security**: Request validation, CORS, and Helmet protection
- 📝 **Comprehensive Logging**: Structured logging with Winston
- 🐳 **Docker Support**: Development and production containers
- 🔍 **Health Checks**: Detailed health monitoring endpoints
- 📚 **API Documentation**: Auto-generated API docs

## Quick Start

### Prerequisites

- Node.js 18+
- Redis 6+
- LINE Developer Account
- Docker (optional)

### Installation

1. **Clone and setup**:
   ```bash
   cd backend/line
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your LINE Bot credentials
   ```

3. **Required Environment Variables**:
   ```env
   LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
   LINE_CHANNEL_SECRET=your_channel_secret
   REDIS_URL=redis://localhost:6379
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f line-service

# Stop services
docker-compose down
```

## API Endpoints

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/health/redis` - Redis connection status
- `GET /api/health/line` - LINE API status

### Webhook
- `POST /api/webhook` - LINE webhook endpoint
- `GET /api/webhook/events` - Recent webhook events
- `POST /api/webhook/simulate` - Simulate webhook events

### Messages
- `POST /api/messages/reply` - Reply to messages
- `POST /api/messages/push` - Push messages
- `POST /api/messages/multicast` - Multicast messages
- `POST /api/messages/broadcast` - Broadcast messages
- `GET /api/messages/history/:userId` - Message history
- `GET /api/messages/analytics` - Message analytics

### Users
- `GET /api/users` - List users (paginated)
- `GET /api/users/search` - Search users
- `GET /api/users/:userId` - Get user details
- `GET /api/users/:userId/profile` - Get LINE profile
- `PUT /api/users/:userId/settings` - Update user settings
- `POST /api/users/:userId/block` - Block user
- `POST /api/users/:userId/unblock` - Unblock user

## Architecture

```
src/
├── config/          # Configuration files
│   └── redis.ts     # Redis connection and cache service
├── routes/          # API route handlers
│   ├── health.ts    # Health check endpoints
│   ├── webhook.ts   # LINE webhook handling
│   ├── messages.ts  # Message API endpoints
│   ├── users.ts     # User API endpoints
│   └── index.ts     # Route aggregation
├── services/        # Business logic services
│   ├── webhook.ts   # Webhook event processing
│   ├── message.ts   # Message handling service
│   └── user.ts      # User management service
├── types/           # TypeScript type definitions
│   └── line.ts      # LINE-specific types
├── utils/           # Utility functions
│   └── logger.ts    # Logging utilities
├── index.ts         # Application entry point
└── server.ts        # Express server configuration
```

## Services

### WebhookService
Handles incoming LINE webhook events:
- Message events (text, image, sticker, etc.)
- Follow/unfollow events
- Join/leave events
- Postback events
- Custom event handlers

### MessageService
Manages message operations:
- Send reply messages
- Push messages to users
- Multicast to multiple users
- Broadcast to all users
- Message history and analytics

### UserService
Handles user management:
- User profile retrieval
- Settings management
- Activity tracking
- User blocking/unblocking
- User analytics

### CacheService
Redis-based caching:
- User data caching
- Message history caching
- Event data caching
- Rate limiting

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- **LINE Configuration**: Channel tokens and secrets
- **Server Configuration**: Port, host, environment
- **Redis Configuration**: Connection settings
- **Logging Configuration**: Log levels and file settings
- **Security Configuration**: CORS, rate limiting, helmet
- **Feature Flags**: Enable/disable specific features

### Logging

Structured logging with multiple levels:
- **Error logs**: `logs/error-YYYY-MM-DD.log`
- **Combined logs**: `logs/combined-YYYY-MM-DD.log`
- **Access logs**: `logs/access-YYYY-MM-DD.log`

## Development

### Scripts

```bash
# Development
npm run dev          # Start with hot reload
npm run dev:debug    # Start with debugging

# Building
npm run build        # Compile TypeScript
npm run start        # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # ESLint check
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript check

# Utilities
npm run clean        # Clean build artifacts
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
```

### Testing

Comprehensive test suite with Jest:
- Unit tests for services
- Integration tests for APIs
- Webhook simulation tests
- Redis integration tests

### Code Quality

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Husky**: Git hooks for quality checks

## Deployment

### Production Docker

```bash
# Build production image
docker build -f Dockerfile -t aiagent-line-service .

# Run production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup

1. **Production Environment**:
   ```bash
   cp .env.example .env.production
   # Configure production values
   ```

2. **SSL Certificates**:
   ```bash
   mkdir ssl
   # Add your SSL certificates
   ```

3. **Nginx Configuration**:
   ```bash
   # Configure nginx.prod.conf for your domain
   ```

### Monitoring

Optional monitoring stack:
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Redis Commander**: Redis management

```bash
# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

## LINE Bot Setup

1. **Create LINE Bot**:
   - Go to [LINE Developers Console](https://developers.line.biz/)
   - Create a new channel (Messaging API)
   - Get Channel Access Token and Channel Secret

2. **Configure Webhook**:
   - Set webhook URL: `https://yourdomain.com/api/webhook`
   - Enable webhook
   - Verify webhook signature

3. **Bot Settings**:
   - Enable "Use webhooks"
   - Disable "Auto-reply messages" (optional)
   - Configure rich menu (optional)

## Security

- **Webhook Signature Verification**: Validates LINE webhook signatures
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers
- **Input Validation**: Request data validation
- **Error Handling**: Secure error responses

## Performance

- **Redis Caching**: Fast data retrieval
- **Connection Pooling**: Efficient database connections
- **Async Processing**: Non-blocking operations
- **Rate Limiting**: API protection
- **Health Checks**: System monitoring
- **Logging Optimization**: Structured logging

## Troubleshooting

### Common Issues

1. **Webhook Verification Failed**:
   ```bash
   # Check channel secret configuration
   echo $LINE_CHANNEL_SECRET
   ```

2. **Redis Connection Error**:
   ```bash
   # Check Redis connectivity
   redis-cli ping
   ```

3. **LINE API Errors**:
   ```bash
   # Check access token
   curl -H "Authorization: Bearer $LINE_CHANNEL_ACCESS_TOKEN" \
        https://api.line.me/v2/bot/info
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG_LOG_ENABLED=true
npm run dev
```

### Health Checks

```bash
# Check service health
curl http://localhost:3003/api/health/detailed

# Check specific components
curl http://localhost:3003/api/health/redis
curl http://localhost:3003/api/health/line
```

## Contributing

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Testing**: Add tests for new features
3. **Documentation**: Update README and code comments
4. **Type Safety**: Maintain strict TypeScript compliance

## License

This project is part of the AI Agent platform. See the main project license for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Consult the LINE Messaging API documentation
4. Create an issue in the project repository