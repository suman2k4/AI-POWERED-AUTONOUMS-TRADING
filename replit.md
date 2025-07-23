# TradePro - Trading Platform Application

## Overview

TradePro is a modern, full-stack trading platform application built with a React frontend and Express.js backend. The application provides a comprehensive trading experience with portfolio management, real-time market data, AI-powered insights, and advanced trading features including backtesting and strategy development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based architecture with:
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with a custom dark theme optimized for trading platforms
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
The backend follows a RESTful API design pattern with:
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket integration for live market data
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Database Provider**: Neon Database (@neondatabase/serverless)

### UI/UX Design Philosophy
- Dark theme optimized for trading environments
- Professional color scheme with blue accents
- Responsive design supporting desktop and mobile
- Trading-specific color coding (green for gains, red for losses)

## Key Components

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main entities:
- **Users**: User authentication and profile management
- **Portfolios**: User portfolio tracking with real-time value calculations
- **Stocks**: Market data and stock information
- **Positions**: User stock holdings and performance metrics
- **Trades**: Transaction history and trade execution records
- **Strategies**: AI-powered trading strategies
- **AI Insights**: Machine learning-generated market insights
- **Price History**: Historical price data for charting and analysis

### Core Features
1. **Dashboard**: Portfolio overview with real-time updates, price charts, recent trades, and market movers
2. **Portfolio Management**: Detailed position tracking with profit/loss calculations
3. **Trading Interface**: Stock selection and trade execution with multiple order types
4. **AI Strategies**: Automated trading strategy creation and management
5. **Backtesting**: Historical strategy performance analysis
6. **AI Assistant**: Chat interface for trading insights and market analysis

### API Structure
The backend provides RESTful endpoints for:
- Portfolio data (`/api/portfolio/:userId`)
- Stock information (`/api/stocks`, `/api/stocks/top-movers`)
- Trading operations (`/api/trades/:userId`)
- Strategy management (`/api/strategies/:userId`)
- AI insights (`/api/ai-insights/:userId`)
- Position tracking (`/api/positions/:userId`)

### Real-time Features
WebSocket implementation provides live updates for:
- Market price changes
- Portfolio value updates
- Trade confirmations
- Connection status monitoring

## Data Flow

### Client-Server Communication
1. **REST API**: Primary communication method for CRUD operations
2. **WebSocket**: Real-time data streaming for market updates
3. **React Query**: Intelligent caching and synchronization of server state
4. **Form Validation**: Client-side validation with Zod schemas before API calls

### State Management Strategy
- Server state managed by TanStack Query with automatic caching and invalidation
- Local UI state managed by React hooks
- WebSocket messages update cached data for real-time synchronization
- Form state handled by React Hook Form with validation

### Database Operations
- Drizzle ORM provides type-safe database queries
- Schema-first approach with TypeScript type generation
- Migrations managed through Drizzle Kit
- Connection pooling handled by Neon Database

## External Dependencies

### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect

### Frontend Libraries
- **Radix UI**: Accessible UI component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Client-side charting for price visualization
- **Lucide React**: Icon library for consistent UI elements

### Development Tools
- **TypeScript**: Static type checking across the entire stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Backend bundling for production deployment

### Session and Security
- **connect-pg-simple**: PostgreSQL-backed session storage
- **Express session middleware**: Secure session management

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Express server with middleware for API routing and static file serving
- TypeScript compilation with incremental builds
- Replit-specific development tools and error overlays

### Production Build Process
1. **Frontend**: Vite builds optimized React application to `dist/public`
2. **Backend**: ESBuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command
4. **Assets**: Static files served from built frontend directory

### Environment Configuration
- Environment variables for database connection (`DATABASE_URL`)
- Development vs production mode detection
- Replit-specific configuration for cloud deployment

### Scalability Considerations
- Stateless server design for horizontal scaling
- Database connection pooling through Neon
- Client-side caching reduces server load
- WebSocket connections managed per user session