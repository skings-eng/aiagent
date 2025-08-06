# AI Agent Backend API

A comprehensive backend API server for the AI Agent application, built with Node.js, Express, TypeScript, MongoDB, and Redis.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user lifecycle management with profiles and activity tracking
- **AI Model Management**: Support for multiple AI providers (OpenAI, Anthropic, Google AI)
- **Prompt Management**: Create, share, and manage AI prompts with versioning
- **Settings Management**: Configurable application settings with validation
- **Rate Limiting**: Redis-based rate limiting for API protection
- **File Upload**: Support for image and document uploads with validation
- **Logging**: Comprehensive logging with Winston and daily rotation
- **Caching**: Redis-based caching for improved performance
- **Validation**: Request validation with express-validator
- **Security**: Helmet, CORS, and other security middleware

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Logging**: Winston
- **Testing**: Jest
- **Documentation**: Built-in API documentation

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- MongoDB 5.0 or higher
- Redis 6.0 or higher

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aiagent/backend/api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values.

4. **Start MongoDB and Redis**
   ```bash
   # MongoDB (if using local installation)
   mongod
   
   # Redis (if using local installation)
   redis-server
   ```

## Configuration

### Environment Variables

Key environment variables that need to be configured:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/aiagent
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# AI API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Development

### Running the Development Server

```bash
# Start in development mode with hot reload
npm run dev

# Build the project
npm run build

# Start production server
npm start
```

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run typecheck` - Run TypeScript type checking

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

The API uses JWT Bearer tokens for authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `GET /me` - Get current user info

#### Users (`/api/users`)
- `GET /` - Get all users (admin)
- `GET /:id` - Get user by ID
- `POST /` - Create user (admin)
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (admin)

#### AI Models (`/api/ai-models`)
- `GET /` - Get all AI models
- `GET /active` - Get active models
- `POST /` - Create model (admin)
- `PUT /:id` - Update model (admin)
- `DELETE /:id` - Delete model (admin)

#### Prompts (`/api/prompts`)
- `GET /` - Get all prompts
- `GET /popular` - Get popular prompts
- `POST /` - Create prompt
- `PUT /:id` - Update prompt
- `DELETE /:id` - Delete prompt
- `POST /search` - Advanced search

#### Settings (`/api/settings`)
- `GET /` - Get all settings (admin)
- `GET /public` - Get public settings
- `PUT /:key` - Update setting (admin)
- `POST /bulk-update` - Bulk update (admin)

### API Documentation Endpoint

Visit `/api/docs` for complete API documentation with all available endpoints.

## Database Schema

### User Model
- Authentication (username, email, password)
- Profile information
- Roles and permissions
- Activity logging
- Session management

### AI Model
- Model configuration
- Provider information
- Usage statistics
- Performance metrics

### Prompt
- Content and metadata
- Usage analytics
- Version control
- Collaboration features

### Settings
- Key-value configuration
- Validation rules
- Change history

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Password Hashing**: bcrypt for secure password storage
- **Session Management**: Secure session handling

## Monitoring & Logging

- **Winston Logging**: Structured logging with daily rotation
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: Built-in health check endpoints

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure these are set in production:

- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB connection string
- `REDIS_URL` - Production Redis connection string
- `JWT_SECRET` - Strong JWT secret
- `JWT_REFRESH_SECRET` - Strong refresh token secret

### Docker Support

The application can be containerized using Docker. Ensure MongoDB and Redis are available as services.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the logs for debugging information