import { GoogleGenerativeAI } from "@google/generative-ai";
import { Stock, Position, Trade, AiInsight } from "@shared/schema";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY not found in environment variables. AI features will be limited.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ChatMessage {
  role: "user" | "model";
  parts: string;
}

export interface PortfolioContext {
  totalValue: number;
  positions: Position[];
  recentTrades: Trade[];
  stocks: Stock[];
}

class AIService {
  private model = genAI?.getGenerativeModel({ model: "gemini-1.5-flash" });
  private chatSessions = new Map<string, any>();

  /**
   * Generate AI chat response with context
   */
  async generateChatResponse(
    userMessage: string,
    sessionId: string,
    context?: PortfolioContext
  ): Promise<string> {
    if (!this.model) {
      return "AI service is currently unavailable. Please configure GEMINI_API_KEY.";
    }

    try {
      let chat = this.chatSessions.get(sessionId);
      
      if (!chat) {
        // Initialize new chat session with system context
        const systemContext = this.buildSystemContext(context);
        chat = this.model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: systemContext }],
            },
            {
              role: "model",
              parts: [{ text: "I understand. I'm your AI trading assistant ready to help you with portfolio analysis, market insights, and trading strategies. How can I assist you?" }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        });
        this.chatSessions.set(sessionId, chat);
      }

      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("AI chat error:", error);
      return "I apologize, but I encountered an error processing your request. Please try again.";
    }
  }

  /**
   * Generate AI insights based on portfolio and market data
   */
  async generateInsights(
    userId: number,
    context: PortfolioContext
  ): Promise<AiInsight[]> {
    if (!this.model) {
      return this.getMockInsights(userId);
    }

    try {
      const prompt = `Analyze this trading portfolio and provide 3-5 key insights:

Portfolio Value: $${context.totalValue}
Number of Positions: ${context.positions.length}
Recent Trades: ${context.recentTrades.length}

Positions:
${context.positions.slice(0, 10).map(p => `- ${p.quantity} shares`).join('\n')}

Market Context:
${context.stocks.slice(0, 10).map(s => `- ${s.symbol}: $${s.currentPrice} (${s.changePercent}%)`).join('\n')}

Provide insights in this JSON format:
[
  {
    "type": "OPTIMIZATION" | "RISK_ALERT" | "OPPORTUNITY",
    "title": "Brief title",
    "message": "Detailed message",
    "confidence": 0-100,
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "timeframe": "Short-term" | "Medium-term" | "Long-term"
  }
]

Focus on actionable insights about portfolio diversification, risk management, and opportunities.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Try to parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return insights.map((insight: any) => ({
          ...insight,
          userId,
          isRead: false,
        }));
      }
      
      return this.getMockInsights(userId);
    } catch (error) {
      console.error("AI insights generation error:", error);
      return this.getMockInsights(userId);
    }
  }

  /**
   * Generate market analysis
   */
  async analyzeMarket(stocks: Stock[]): Promise<string> {
    if (!this.model) {
      return "Market analysis unavailable. AI service not configured.";
    }

    try {
      const prompt = `Analyze these stock market movements and provide a brief market summary (2-3 paragraphs):

${stocks.map(s => `${s.symbol}: $${s.currentPrice} (${s.changePercent}% change)`).join('\n')}

Focus on overall market sentiment, sector trends, and key movers.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Market analysis error:", error);
      return "Unable to generate market analysis at this time.";
    }
  }

  /**
   * Generate trading signals
   */
  async generateTradingSignals(
    stocks: Stock[],
    positions: Position[]
  ): Promise<Array<{ symbol: string; signal: string; confidence: number; reason: string }>> {
    if (!this.model) {
      return [];
    }

    try {
      const prompt = `Based on these stocks and current positions, suggest 3 trading signals:

Current Stocks:
${stocks.slice(0, 20).map(s => `${s.symbol}: $${s.currentPrice} (${s.changePercent}%)`).join('\n')}

Current Positions:
${positions.slice(0, 10).map(p => `Position ${p.quantity} shares`).join('\n')}

Provide signals in JSON format:
[
  {
    "symbol": "STOCK_SYMBOL",
    "signal": "BUY" | "SELL" | "HOLD",
    "confidence": 0-100,
    "reason": "Brief explanation"
  }
]`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error("Trading signals error:", error);
      return [];
    }
  }

  /**
   * Build system context for chat
   */
  private buildSystemContext(context?: PortfolioContext): string {
    if (!context) {
      return `You are an AI trading assistant for TradePro, an autonomous trading platform. 
You help users with portfolio analysis, market insights, trading strategies, and investment decisions. 
Be concise, professional, and always consider risk management. Provide actionable advice based on market data.`;
    }

    return `You are an AI trading assistant for TradePro. Here's the user's portfolio context:
- Total Portfolio Value: $${context.totalValue}
- Active Positions: ${context.positions.length}
- Recent Trades: ${context.recentTrades.length}

Help them with portfolio analysis, market insights, and trading strategies. Be specific and reference their actual portfolio when relevant.`;
  }

  /**
   * Mock insights fallback
   */
  private getMockInsights(userId: number): AiInsight[] {
    return [
      {
        id: 1,
        userId,
        type: "OPTIMIZATION",
        title: "Portfolio Diversification Opportunity",
        message: "Your portfolio is concentrated in tech stocks. Consider diversifying into other sectors to reduce risk.",
        confidence: 75,
        riskLevel: "MEDIUM",
        timeframe: "Medium-term",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 2,
        userId,
        type: "OPPORTUNITY",
        title: "Market Opportunity Detected",
        message: "Healthcare sector showing strong momentum. Consider positions in leading healthcare companies.",
        confidence: 68,
        riskLevel: "MEDIUM",
        timeframe: "Short-term",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 3,
        userId,
        type: "RISK_ALERT",
        title: "Volatility Alert",
        message: "Increased market volatility detected. Consider implementing stop-loss orders on high-risk positions.",
        confidence: 82,
        riskLevel: "HIGH",
        timeframe: "Short-term",
        isRead: false,
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Clear chat session
   */
  clearChatSession(sessionId: string): void {
    this.chatSessions.delete(sessionId);
  }
}

export const aiService = new AIService();
