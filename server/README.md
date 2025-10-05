# Krishi Connect - Node.js/Express Server

A comprehensive agricultural management system API built with Node.js, Express.js, and PostgreSQL.

## 🌾 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Farmer/Government)
  - Secure password hashing with bcrypt

- **Field Management**
  - Create and manage farm fields
  - Store field coordinates and boundaries
  - Track soil data and field statistics

- **Crop Lifecycle Management**
  - Comprehensive crop tracking
  - Irrigation and fertilizer management
  - Growth stage monitoring
  - Yield prediction integration

- **Climate Damage Claims**
  - Submit and track insurance claims
  - Government review workflow
  - Document management
  - Status tracking and notifications

- **Dashboard Analytics**
  - Farmer dashboard with field/crop insights
  - Government dashboard for policy oversight
  - Real-time statistics and reporting

- **Government Schemes Integration**
  - PMFBY (Pradhan Mantri Fasal Bima Yojana)
  - Weather-Based Crop Insurance Scheme
  - Kisan Credit Card support
  - Disaster relief programs

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database credentials and other configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=krishi_connect
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_secret_key
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start at `http://localhost:5002`

## 📁 Project Structure

```
server/
├── config/
│   ├── database.js          # Database configuration and connection
│   └── schema.sql           # Database schema definitions
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── validation.js       # Request validation middleware
├── models/
│   └── schemas.js          # Database schemas and validation
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── fields.js           # Field management endpoints
│   ├── crops.js            # Crop management endpoints
│   ├── climateClaims.js    # Climate damage claims endpoints
│   ├── dashboard.js        # Dashboard analytics endpoints
│   ├── governmentSchemes.js # Government schemes endpoints
│   └── health.js           # Health check endpoints
├── services/
│   ├── userService.js      # User management business logic
│   ├── fieldService.js     # Field management business logic
│   ├── cropService.js      # Crop management business logic
│   └── climateClaimService.js # Climate claims business logic
├── scripts/
│   └── initDatabase.js     # Database initialization script
├── server.js               # Main application entry point
├── package.json           # Project dependencies and scripts
└── README.md              # This file
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Field Management
- `GET /api/fields` - List user fields
- `POST /api/fields` - Create new field
- `GET /api/fields/:id` - Get field details
- `PUT /api/fields/:id` - Update field
- `DELETE /api/fields/:id` - Delete field

### Crop Management
- `GET /api/crops` - List crops
- `POST /api/crops` - Create new crop
- `GET /api/crops/:id` - Get crop details
- `POST /api/crops/:id/irrigation` - Add irrigation record
- `POST /api/crops/:id/fertilizer` - Add fertilizer application

### Climate Damage Claims
- `GET /api/climate-damage-claims` - List user claims
- `POST /api/climate-damage-claims` - Submit new claim
- `GET /api/climate-damage-claims/:id` - Get claim details
- `PUT /api/climate-damage-claims/:id/status` - Update claim status (Government only)

### Dashboard
- `GET /api/dashboard/farmer` - Farmer dashboard data
- `GET /api/dashboard/government` - Government dashboard data
- `GET /api/dashboard/analytics` - System analytics

### Government Schemes
- `GET /api/government-schemes` - List available schemes
- `GET /api/government-schemes/:code` - Get scheme details

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- `GET /health/database` - Database connectivity check

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and authentication
- **fields** - Farm field information
- **crops** - Crop lifecycle data
- **irrigation_records** - Irrigation tracking
- **fertilizer_applications** - Fertilizer usage
- **climate_damage_claims** - Insurance claims
- **government_schemes** - Available government programs

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Configurable cross-origin policies
- **Input Validation** - Joi-based request validation
- **SQL Injection Prevention** - Parameterized queries
- **Helmet Security** - Security headers middleware

## 🚦 Environment Configuration

Key environment variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5002
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=krishi_connect
DB_USER=your_username
DB_PASSWORD=your_password

# Security
JWT_SECRET=your_jwt_secret
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Logging & Monitoring

- **Winston Logger** - Structured logging with multiple transports
- **Request Logging** - Automatic HTTP request/response logging
- **Error Handling** - Comprehensive error tracking
- **Performance Monitoring** - Response time tracking
- **Health Checks** - System status monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "authentication"
```

## 📦 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build and start
npm run build
npm start

# Using PM2 for process management
npm install -g pm2
pm2 start server.js --name "krishi-connect-api"
```

### Docker (Optional)
```bash
# Build image
docker build -t krishi-connect-api .

# Run container
docker run -p 5002:5002 krishi-connect-api
```

## 🔧 Scripts

Available npm scripts:

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database schema and seed data
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

For detailed API documentation with examples:

1. Start the server
2. Visit `http://localhost:5002/api` for endpoint overview
3. Use tools like Postman or Insomnia with the provided collection

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **JWT Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Ensure proper header format: `Authorization: Bearer <token>`

3. **CORS Errors**
   - Update ALLOWED_ORIGINS in `.env`
   - Check client-side request configuration

4. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `npx kill-port 5002`

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
LOG_LEVEL=debug
DEBUG_SQL=true
```

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## 🔄 Migration from Flask

This Node.js server replaces the original Flask server with identical functionality:

- ✅ All API endpoints maintained
- ✅ Database schema preserved
- ✅ Authentication system compatible
- ✅ Response formats unchanged
- ✅ Business logic identical

Simply update your client configuration to point to the new server URL.

---

**Built with ❤️ for farmers and agricultural innovation**