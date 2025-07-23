import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTradeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Portfolio API
  app.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const portfolio = await storage.getPortfolio(userId);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stocks API
  app.get("/api/stocks", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stocks/top-movers", async (req, res) => {
    try {
      const topMovers = await storage.getTopMovers();
      res.json(topMovers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Trades API
  app.get("/api/trades/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trades = await storage.getUserTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/trades", async (req, res) => {
    try {
      const validatedData = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(validatedData);
      res.status(201).json(trade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trade data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Positions API
  app.get("/api/positions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const positions = await storage.getUserPositions(userId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Insights API
  app.get("/api/ai-insights/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const insights = await storage.getUserAiInsights(userId, limit);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Strategies API
  app.get("/api/strategies/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const strategies = await storage.getUserStrategies(userId);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User API
  app.get("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    // Send initial data
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to TradePro WebSocket'
    }));

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received:', data);

        // Handle different message types
        switch (data.type) {
          case 'subscribe':
            // Subscribe to real-time updates
            break;
          case 'unsubscribe':
            // Unsubscribe from updates
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Simulate real-time price updates
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Generate random price updates
        const symbols = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'GOOGL'];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const priceChange = (Math.random() - 0.5) * 10; // Random change between -5 and +5
        const percentChange = (Math.random() - 0.5) * 4; // Random change between -2% and +2%

        client.send(JSON.stringify({
          type: 'price_update',
          data: {
            symbol: randomSymbol,
            priceChange,
            percentChange,
            timestamp: new Date().toISOString()
          }
        }));
      }
    });
  }, 3000); // Update every 3 seconds

  // Simulate portfolio updates
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const portfolioUpdate = {
          totalValue: (125000 + Math.random() * 10000).toFixed(2),
          dayGain: ((Math.random() - 0.5) * 5000).toFixed(2),
          dayGainPercent: ((Math.random() - 0.5) * 4).toFixed(2),
        };

        client.send(JSON.stringify({
          type: 'portfolio_update',
          data: portfolioUpdate
        }));
      }
    });
  }, 5000); // Update every 5 seconds

  return httpServer;
}
