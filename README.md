# AI-Powered Autonomous Trading System 🚀📈

This project is a full-stack AI-powered trading platform that automates market trend analysis, generates trading signals, and can execute trades in real-time. Built with **Express.js**, **TypeScript**, **React**, and **Google Gemini AI**, it ensures real-time data flow and intelligent strategy execution.

---

## ✨ Key Features

- 🤖 **Google Gemini AI Integration**: Real-time AI chat assistant for portfolio analysis, market insights, and trading strategies
- 📊 **Interactive Dashboard**: Real-time portfolio tracking with animated charts and live updates
- 💬 **AI Chat Assistant**: Contextual AI responses powered by Google Gemini with quick action buttons
- 📈 **Market Analysis**: AI-powered market trend analysis and technical indicators interpretation
- 🎯 **Trading Signals**: AI-generated buy/sell/hold recommendations with confidence scores
- 🔔 **AI Insights**: Automated portfolio optimization suggestions and risk alerts
- 🎨 **Modern UI**: Smooth animations, gradient backgrounds, and responsive design
- ⚡ **WebSocket**: Real-time trading data and signal transmission
- 🔐 **Secure**: API keys stored securely in backend environment

---

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript  
- **AI**: Google Gemini AI (gemini-1.5-flash model)
- **UI Components**: Radix UI, shadcn/ui, Recharts
- **Real-time**: WebSocket for live updates
- **Build Tools**: Vite, esbuild
- **Database**: PostgreSQL (via Drizzle ORM)

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development
GEMINI_API_KEY=your_google_gemini_api_key_here
```

To get your Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### 3. Run the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5001`

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 📱 Features Overview

### AI Assistant
- **Real-time Chat**: Ask questions about your portfolio, market trends, or trading strategies
- **Context-Aware**: AI remembers your conversation history within the session
- **Quick Actions**: Pre-defined prompts for common queries
- **Categorized Responses**: Analysis, recommendations, and alerts with visual indicators

### Dashboard
- **Portfolio Overview**: Real-time total value, day gain/loss, and buying power
- **Interactive Charts**: Animated price charts with multiple timeframes
- **Top Movers**: Live tracking of best and worst performing stocks
- **AI Insights**: Automated suggestions for portfolio optimization

### Trading Interface
- **Real-time Quotes**: Live stock prices via WebSocket
- **AI-Powered Signals**: Buy/sell recommendations with confidence scores
- **Risk Management**: Automated risk alerts and portfolio diversification suggestions

---

## 🎨 UI Enhancements

- ✨ **Smooth Animations**: Fade-in and slide-in effects for content
- 🌈 **Gradient Backgrounds**: Modern gradient effects on AI components
- 🎭 **Bounce Animations**: Interactive loading indicators
- 🖱️ **Hover Effects**: Card hover transformations and transitions
- 📱 **Responsive Design**: Mobile-friendly interface

---

## 🔒 Security

- API keys are stored only in backend environment variables
- No sensitive credentials exposed to frontend
- Environment variables loaded securely via dotenv
- WebSocket connections validated

---

## 📊 API Endpoints

### AI Endpoints
- `POST /api/ai/chat` - AI chat conversation
- `GET /api/ai/market-analysis` - AI market analysis
- `GET /api/ai/trading-signals` - AI trading signals
- `GET /api/ai-insights/:userId` - AI portfolio insights

### Trading Endpoints
- `GET /api/portfolio/:userId` - User portfolio
- `GET /api/stocks` - Stock listings
- `GET /api/stocks/top-movers` - Top movers
- `POST /api/trades` - Execute trades

---

## 🛠️ Development

### TypeScript Check
```bash
npm run check
```

### Database Migration
```bash
npm run db:push
```

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- Powered by [Google Gemini AI](https://ai.google.dev/)
- UI Components by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide React](https://lucide.dev/)

