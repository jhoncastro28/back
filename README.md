# Almendros - Backend

A robust backend system built with NestJS and TypeScript for inventory management.

## Technology Stack

- Node.js v22.15.0
- NestJS v10
- TypeScript
- PostgreSQL
- Prisma ORM
- Jest for testing
- ESLint + Prettier for code quality

## Prerequisites

- Node.js v22.15.0 (as specified in `.node-version`)
- npm v10 or higher
- PostgreSQL database server

## Project Setup

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd backend-almendros
npm install
```

2. Environment Configuration:

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:port/database_name?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
```

## Database Setup

1. Generate Prisma client:

```bash
npx prisma generate
```

2. Run database migrations:

```bash
npx prisma migrate dev
```

3. (Optional) Seed the database:

```bash
npm run seed
```

## Development

### Running the Application

```bash
# Development mode
$ npm run start:dev

# Production mode
$ npm run start:prod

# Debug mode
$ npm run start:debug
```

### Code Quality and Testing

The project uses ESLint and Prettier for code quality. Configuration can be found in `.eslintrc.js`.

```bash
# Run linting
$ npm run lint

# Fix linting issues
$ npm run lint:fix

# Format code
$ npm run format

# Run tests
$ npm run test

# Run tests with coverage
$ npm run test:cov
```

### API Documentation

Once the application is running, access the Swagger documentation at:

- <http://localhost:3000/api/docs>

## Main Application Features

### Security Features

- CORS protection with configurable origins
- Helmet for HTTP header security
- Rate limiting for API endpoints
- JWT authentication
- Input validation and sanitization

### Database Schema

The Prisma schema (`schema.prisma`) defines the following main entities:

- Users (Authentication and authorization)
- Clients (Customer management)
- Suppliers (Vendor management)
- Products (Inventory items)
- Prices (Product pricing history)
- Sales (Transaction records)
- Inventory Movements (Stock tracking)

### API Endpoints

The API is organized around the following main resources:

- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/products` - Product management
- `/api/sales` - Sales operations
- `/api/inventory` - Inventory management
- `/api/clients` - Client management
- `/api/suppliers` - Supplier management

## Production Considerations

1. Environment Variables:

   - Ensure all sensitive data is properly configured in environment variables
   - Use strong JWT secrets in production
   - Configure appropriate CORS origins

2. Database:

   - Regular backups
   - Connection pool optimization
   - Index optimization for common queries

3. Security:
   - Enable rate limiting
   - Configure appropriate CORS settings
   - Use HTTPS in production
   - Regular security audits

## Troubleshooting

1. Prisma Issues:

   - Run `npx prisma generate` after schema changes
   - Clear Prisma cache: `npx prisma generate --watch`
   - Verify database connection string

2. TypeScript Errors:
   - Ensure `generated` folder is excluded in `tsconfig.json`
   - Run `npm run build` to verify compilation
   - Check for missing type definitions

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Create detailed pull requests

## License

This project is licensed under the UNLICENSED license.
