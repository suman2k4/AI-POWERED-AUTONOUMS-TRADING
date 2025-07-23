import { 
  users, portfolios, stocks, positions, trades, strategies, aiInsights, priceHistory,
  type User, type InsertUser, type Portfolio, type InsertPortfolio,
  type Stock, type InsertStock, type Position, type InsertPosition,
  type Trade, type InsertTrade, type Strategy, type InsertStrategy,
  type AiInsight, type InsertAiInsight, type PriceHistory, type InsertPriceHistory
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Portfolio methods
  getPortfolio(userId: number): Promise<Portfolio | undefined>;
  updatePortfolio(userId: number, portfolio: Partial<Portfolio>): Promise<Portfolio | undefined>;

  // Stock methods
  getAllStocks(): Promise<Stock[]>;
  getStock(symbol: string): Promise<Stock | undefined>;
  getTopMovers(): Promise<Stock[]>;
  updateStockPrice(symbol: string, price: number, changePercent: number): Promise<void>;

  // Position methods
  getUserPositions(userId: number): Promise<(Position & { stock: Stock })[]>;
  getPosition(userId: number, stockId: number): Promise<Position | undefined>;
  updatePosition(id: number, position: Partial<Position>): Promise<Position | undefined>;

  // Trade methods
  getUserTrades(userId: number, limit?: number): Promise<(Trade & { stock: Stock })[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, trade: Partial<Trade>): Promise<Trade | undefined>;

  // Strategy methods
  getUserStrategies(userId: number): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;

  // AI Insights methods
  getUserAiInsights(userId: number, limit?: number): Promise<AiInsight[]>;
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;

  // Price history methods
  getStockPriceHistory(stockId: number, limit?: number): Promise<PriceHistory[]>;
  addPriceHistory(priceHistory: InsertPriceHistory): Promise<PriceHistory>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<number, Portfolio>;
  private stocks: Map<number, Stock>;
  private positions: Map<number, Position>;
  private trades: Map<number, Trade>;
  private strategies: Map<number, Strategy>;
  private aiInsights: Map<number, AiInsight>;
  private priceHistory: Map<number, PriceHistory>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.stocks = new Map();
    this.positions = new Map();
    this.trades = new Map();
    this.strategies = new Map();
    this.aiInsights = new Map();
    this.priceHistory = new Map();
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Create sample user
    const user: User = {
      id: 1,
      username: "john_doe",
      email: "john@example.com",
      password: "hashed_password",
      firstName: "John",
      lastName: "Doe",
      plan: "Pro Trader",
      createdAt: new Date(),
    };
    this.users.set(1, user);

    // Create sample portfolio
    const portfolio: Portfolio = {
      id: 1,
      userId: 1,
      totalValue: "125847.92",
      dayGain: "1247.85",
      dayGainPercent: "1.82",
      buyingPower: "15230.47",
      activePositions: 14,
      updatedAt: new Date(),
    };
    this.portfolios.set(1, portfolio);

    // Create sample stocks
    const sampleStocks: Stock[] = [
      { id: 1, symbol: "AAPL", name: "Apple Inc.", currentPrice: "184.75", changePercent: "2.34", volume: 45000000, marketCap: "2850000000000", sector: "Technology", updatedAt: new Date() },
      { id: 2, symbol: "TSLA", name: "Tesla Inc.", currentPrice: "249.00", changePercent: "-1.12", volume: 25000000, marketCap: "790000000000", sector: "Automotive", updatedAt: new Date() },
      { id: 3, symbol: "MSFT", name: "Microsoft Corp.", currentPrice: "275.19", changePercent: "0.87", volume: 32000000, marketCap: "2040000000000", sector: "Technology", updatedAt: new Date() },
      { id: 4, symbol: "NVDA", name: "NVIDIA Corp", currentPrice: "487.92", changePercent: "8.42", volume: 38000000, marketCap: "1200000000000", sector: "Technology", updatedAt: new Date() },
      { id: 5, symbol: "AMZN", name: "Amazon.com Inc", currentPrice: "142.38", changePercent: "5.67", volume: 28000000, marketCap: "1480000000000", sector: "Consumer Discretionary", updatedAt: new Date() },
      { id: 6, symbol: "GOOGL", name: "Alphabet Inc", currentPrice: "138.47", changePercent: "3.21", volume: 22000000, marketCap: "1750000000000", sector: "Technology", updatedAt: new Date() },
    ];

    sampleStocks.forEach(stock => this.stocks.set(stock.id, stock));

    // Create sample trades
    const sampleTrades: Trade[] = [
      { id: 1, userId: 1, stockId: 1, type: "BUY", quantity: 10, price: "184.75", totalAmount: "1847.50", status: "EXECUTED", orderType: "MARKET", createdAt: new Date(), executedAt: new Date() },
      { id: 2, userId: 1, stockId: 2, type: "SELL", quantity: 5, price: "249.00", totalAmount: "1245.00", status: "EXECUTED", orderType: "MARKET", createdAt: new Date(), executedAt: new Date() },
      { id: 3, userId: 1, stockId: 3, type: "BUY", quantity: 15, price: "275.19", totalAmount: "4127.85", status: "EXECUTED", orderType: "MARKET", createdAt: new Date(), executedAt: new Date() },
    ];

    sampleTrades.forEach(trade => this.trades.set(trade.id, trade));

    // Create sample AI insights
    const sampleInsights: AiInsight[] = [
      { id: 1, userId: 1, type: "OPTIMIZATION", title: "Portfolio Optimization", message: "Consider rebalancing your tech holdings. AAPL showing strong momentum for next quarter.", confidence: 87, riskLevel: "LOW", timeframe: null, isRead: false, createdAt: new Date() },
      { id: 2, userId: 1, type: "RISK_ALERT", title: "Risk Alert", message: "High correlation detected in your energy sector positions. Consider diversifying.", confidence: null, riskLevel: "MEDIUM", timeframe: null, isRead: false, createdAt: new Date() },
      { id: 3, userId: 1, type: "OPPORTUNITY", title: "Market Opportunity", message: "Oversold condition detected in semiconductor stocks. Potential entry point identified.", confidence: null, riskLevel: null, timeframe: "3-5 days", isRead: false, createdAt: new Date() },
    ];

    sampleInsights.forEach(insight => this.aiInsights.set(insight.id, insight));

    this.currentId = 100;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getPortfolio(userId: number): Promise<Portfolio | undefined> {
    return Array.from(this.portfolios.values()).find(p => p.userId === userId);
  }

  async updatePortfolio(userId: number, portfolio: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const existing = await this.getPortfolio(userId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...portfolio, updatedAt: new Date() };
    this.portfolios.set(existing.id, updated);
    return updated;
  }

  async getAllStocks(): Promise<Stock[]> {
    return Array.from(this.stocks.values());
  }

  async getStock(symbol: string): Promise<Stock | undefined> {
    return Array.from(this.stocks.values()).find(s => s.symbol === symbol);
  }

  async getTopMovers(): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent))
      .slice(0, 10);
  }

  async updateStockPrice(symbol: string, price: number, changePercent: number): Promise<void> {
    const stock = await this.getStock(symbol);
    if (stock) {
      stock.currentPrice = price.toString();
      stock.changePercent = changePercent.toString();
      stock.updatedAt = new Date();
      this.stocks.set(stock.id, stock);
    }
  }

  async getUserPositions(userId: number): Promise<(Position & { stock: Stock })[]> {
    const userPositions = Array.from(this.positions.values()).filter(p => p.userId === userId);
    return userPositions.map(position => {
      const stock = this.stocks.get(position.stockId)!;
      return { ...position, stock };
    });
  }

  async getPosition(userId: number, stockId: number): Promise<Position | undefined> {
    return Array.from(this.positions.values()).find(p => p.userId === userId && p.stockId === stockId);
  }

  async updatePosition(id: number, position: Partial<Position>): Promise<Position | undefined> {
    const existing = this.positions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...position, updatedAt: new Date() };
    this.positions.set(id, updated);
    return updated;
  }

  async getUserTrades(userId: number, limit: number = 50): Promise<(Trade & { stock: Stock })[]> {
    const userTrades = Array.from(this.trades.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return userTrades.map(trade => {
      const stock = this.stocks.get(trade.stockId)!;
      return { ...trade, stock };
    });
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentId++;
    const trade: Trade = { ...insertTrade, id, createdAt: new Date(), executedAt: null };
    this.trades.set(id, trade);
    return trade;
  }

  async updateTrade(id: number, trade: Partial<Trade>): Promise<Trade | undefined> {
    const existing = this.trades.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...trade };
    this.trades.set(id, updated);
    return updated;
  }

  async getUserStrategies(userId: number): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(s => s.userId === userId);
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const id = this.currentId++;
    const strategy: Strategy = { ...insertStrategy, id, createdAt: new Date(), updatedAt: new Date() };
    this.strategies.set(id, strategy);
    return strategy;
  }

  async getUserAiInsights(userId: number, limit: number = 10): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values())
      .filter(i => i.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createAiInsight(insertInsight: InsertAiInsight): Promise<AiInsight> {
    const id = this.currentId++;
    const insight: AiInsight = { ...insertInsight, id, createdAt: new Date() };
    this.aiInsights.set(id, insight);
    return insight;
  }

  async getStockPriceHistory(stockId: number, limit: number = 100): Promise<PriceHistory[]> {
    return Array.from(this.priceHistory.values())
      .filter(p => p.stockId === stockId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async addPriceHistory(insertPriceHistory: InsertPriceHistory): Promise<PriceHistory> {
    const id = this.currentId++;
    const priceHistory: PriceHistory = { ...insertPriceHistory, id, timestamp: new Date() };
    this.priceHistory.set(id, priceHistory);
    return priceHistory;
  }
}

export const storage = new MemStorage();
