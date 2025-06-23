# QuantCrux - Quantitative Finance Platform

A comprehensive full-stack quantitative finance platform built with Spring Boot and React, designed for institutional-grade trading, portfolio management, and quantitative research.

## 🚀 Overview

QuantCrux is a professional-grade quantitative finance platform that provides:

- **Strategy Development**: Build and version-control quantitative trading strategies
- **Backtesting Engine**: Test strategies against historical market data
- **Product Creation**: Design structured financial products and derivatives
- **Portfolio Management**: Real-time portfolio tracking and analytics
- **Risk Analytics**: Advanced risk metrics and performance attribution
- **Trading Desk**: Book trades and manage positions
- **Reporting**: Generate comprehensive financial reports

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.2.0 with Java 17
- **Security**: JWT-based authentication with role-based access control
- **Database**: PostgreSQL with JPA/Hibernate
- **API Documentation**: Swagger/OpenAPI
- **Financial Calculations**: Apache Commons Math for quantitative analysis

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Framer Motion animations
- **Charts**: Recharts for data visualization
- **State Management**: React Context API

### Database
- **Primary**: PostgreSQL with comprehensive schema
- **Features**: Row Level Security (RLS), JSONB for flexible data storage
- **Migrations**: Supabase migration system

## 📋 Features

### User Management & Authentication
- JWT-based authentication with refresh tokens
- Role-based access control (CLIENT, PORTFOLIO_MANAGER, RESEARCHER, ADMIN)
- Session management with device tracking
- User activity logging and audit trails

### Strategy Management
- **Strategy Builder**: Visual strategy creation with technical indicators
- **Version Control**: Complete versioning system for strategies
- **Backtesting**: Monte Carlo simulation and historical testing
- **Performance Analytics**: Sharpe ratio, drawdown, win rate calculations

### Product Creation
- **Structured Products**: Digital options, barrier options, dual currency investments
- **Pricing Engine**: Monte Carlo pricing with Greeks calculation
- **Payoff Visualization**: Interactive payoff diagrams
- **Risk Metrics**: Real-time risk assessment

### Portfolio Management
- **Multi-Portfolio Support**: Create and manage multiple portfolios
- **Real-time P&L**: Live profit/loss tracking
- **Risk Analytics**: VaR, Sharpe ratio, correlation analysis
- **Performance Attribution**: Detailed breakdown by asset class

### Trading Desk
- **Trade Booking**: Professional trade booking interface
- **Live Pricing**: Real-time pricing with confidence intervals
- **Trade Blotter**: Complete trade history and status tracking
- **Position Management**: Real-time position monitoring

### Analytics & Reporting
- **Risk Metrics**: VaR, beta, volatility, correlation analysis
- **Performance Reports**: Comprehensive portfolio performance reports
- **Market Data**: Real-time market data simulation
- **Custom Reports**: Flexible report generation system

## 🛠️ Technology Stack

### Backend Dependencies
```xml
<!-- Core Spring Boot -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Database -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>

<!-- JWT Authentication -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>

<!-- Financial Calculations -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-math3</artifactId>
    <version>3.6.1</version>
</dependency>
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "axios": "^1.10.0",
    "framer-motion": "^10.18.0",
    "recharts": "^2.8.0",
    "lucide-react": "^0.344.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^2.30.0"
  }
}
```

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL 12+
- Maven 3.6+

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd quantcrux
```

2. **Database Setup**
```sql
-- Create database
CREATE DATABASE quantcrux;

-- Create user (optional)
CREATE USER quant_user WITH PASSWORD 'quant_pass';
GRANT ALL PRIVILEGES ON DATABASE quantcrux TO quant_user;
```

3. **Configure Application**
Update `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/quantcrux
    username: quant_user
    password: quant_pass
```

4. **Run Database Migrations**
The application will automatically create tables on startup using the provided SQL migrations.

5. **Start Backend**
```bash
cd backend
mvn clean package
mvn spring-boot:run
```

The backend will start on `http://localhost:8081`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Configure Environment**
Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8081
```

3. **Start Frontend**
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### Demo Users

The application creates demo users automatically:

| Username    | Password | Role              | Description                    |
|-------------|----------|-------------------|--------------------------------|
| admin       | password | ADMIN             | System administrator           |
| client1     | password | CLIENT            | Investment client              |
| client2     | password | CLIENT            | Investment client              |
| pm1         | password | PORTFOLIO_MANAGER | Portfolio manager              |
| pm2         | password | PORTFOLIO_MANAGER | Portfolio manager              |
| researcher1 | password | RESEARCHER        | Quantitative researcher        |
| researcher2 | password | RESEARCHER        | Quantitative researcher        |

## 📊 Database Schema

### Core Tables

#### Users
- User authentication and profile management
- Role-based access control
- Session tracking and security

#### Strategies
- Quantitative trading strategies
- Technical indicators configuration
- Trading rules and risk management

#### Strategy Versions
- Complete version control for strategies
- JSONB storage for flexible configuration
- Change tracking and rollback capabilities

#### Products
- Structured financial products
- Pricing parameters and terms
- Product lifecycle management

#### Portfolios
- Portfolio management and tracking
- Real-time metrics calculation
- Performance analytics

#### Trades
- Trade booking and execution
- Position tracking and P&L
- Trade lifecycle management

## 🔐 Security Features

### Authentication
- JWT tokens with refresh mechanism
- Secure password hashing (BCrypt)
- Account lockout protection
- Session management with device tracking

### Authorization
- Role-based access control (RBAC)
- Method-level security annotations
- Resource-level permissions
- API endpoint protection

### Data Security
- Row Level Security (RLS) in database
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 🎯 User Roles & Permissions

### CLIENT
- View portfolios and positions
- Execute trades through trading desk
- Access market data and analytics
- Generate basic reports

### PORTFOLIO_MANAGER
- All CLIENT permissions
- Create and manage structured products
- Access advanced trading features
- Manage client portfolios
- Generate comprehensive reports

### RESEARCHER
- All CLIENT permissions
- Create and manage trading strategies
- Run backtests and simulations
- Access advanced analytics
- Strategy version control

### ADMIN
- Full system access
- User management
- System monitoring and health checks
- Advanced configuration

## 📈 API Endpoints

### Authentication
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/auth/refresh        # Token refresh
POST /api/auth/logout         # User logout
GET  /api/auth/profile        # User profile
```

### Strategies
```
GET    /api/strategies                    # Get user strategies
POST   /api/strategies                    # Create strategy
GET    /api/strategies/{id}               # Get strategy details
PUT    /api/strategies/{id}               # Update strategy
DELETE /api/strategies/{id}               # Delete strategy
GET    /api/strategies/{id}/versions      # Get strategy versions
POST   /api/strategies/{id}/versions      # Create new version
```

### Products
```
GET  /api/products           # Get all products
POST /api/products           # Create product
GET  /api/products/{id}      # Get product details
```

### Trading
```
POST /api/trades/book        # Book trade
GET  /api/trades             # Get user trades
GET  /api/trades/{id}        # Get trade details
PUT  /api/trades/{id}/status # Update trade status
```

### Portfolio Management
```
GET    /api/portfolios       # Get user portfolios
POST   /api/portfolios       # Create portfolio
GET    /api/portfolios/{id}  # Get portfolio details
PUT    /api/portfolios/{id}  # Update portfolio
DELETE /api/portfolios/{id}  # Delete portfolio
```

### Analytics
```
GET /api/analytics/risk-metrics    # Get risk metrics
GET /api/market/snapshot          # Market data snapshot
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
mvn test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Configuration

1. **Environment Variables**
```yaml
# application-prod.yml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
  
jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:86400000}
```

2. **Build for Production**
```bash
# Backend
cd backend
mvn clean package -Pprod

# Frontend
cd frontend
npm run build
```

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM openjdk:17-jre-slim
COPY target/quantcrux-backend-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app.jar"]

# Frontend Dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
```

## 📝 Development Guidelines

### Code Style
- Follow Spring Boot best practices
- Use TypeScript for type safety
- Implement proper error handling
- Write comprehensive tests

### Database
- Use migrations for schema changes
- Implement proper indexing
- Follow naming conventions
- Use Row Level Security

### API Design
- RESTful API principles
- Consistent error responses
- Proper HTTP status codes
- Comprehensive documentation

## 🔧 Configuration

### Application Properties
```yaml
# Key configuration options
server:
  port: 8081

spring:
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

jwt:
  secret: your-secret-key
  expiration: 86400000

cors:
  allowed-origins: http://localhost:5173
```

### Environment Variables
```env
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/quantcrux
DATABASE_USERNAME=quant_user
DATABASE_PASSWORD=quant_pass

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=86400000

# Frontend
VITE_API_BASE_URL=http://localhost:8081
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check connection credentials
   - Ensure database exists

2. **CORS Errors**
   - Verify frontend URL in CORS configuration
   - Check browser developer tools

3. **Authentication Issues**
   - Verify JWT secret configuration
   - Check token expiration settings

4. **Build Failures**
   - Ensure Java 17 is installed
   - Verify Maven dependencies
   - Check Node.js version

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://reactjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/) for JWT token debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**QuantCrux** - Professional Quantitative Finance Platform