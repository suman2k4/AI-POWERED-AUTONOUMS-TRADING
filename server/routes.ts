import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTradeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Portfolio API (mocked)
  app.get("/api/portfolio/:userId", async (req, res) => {
    res.json({
      userId: req.params.userId,
      totalValue: 100000,
      positions: [],
      dayGain: 0,
      dayGainPercent: 0
    });
  });

  // Stocks API (mocked)
  app.get("/api/stocks", async (req, res) => {
    res.json([
      { symbol: "AAPL", price: 200 },
      { symbol: "TSLA", price: 800 },
      { symbol: "MSFT", price: 350 }
    ]);
  });

  app.get("/api/stocks/top-movers", async (req, res) => {
    res.json([
      { symbol: "TSLA", price: 800, change: 5 },
      { symbol: "AAPL", price: 200, change: -2 }
    ]);
  });

  // Trades API (mocked)
  app.get("/api/trades/:userId", async (req, res) => {
    res.json([]);
  });

  app.post("/api/trades", async (req, res) => {
    res.status(201).json({ message: "Trade created (mock)" });
  });

  // Positions API (mocked)
  app.get("/api/positions/:userId", async (req, res) => {
    res.json([]);
  });

  // AI Insights API (mocked)
  app.get("/api/ai-insights/:userId", async (req, res) => {
    res.json([]);
  });

  // Strategies API (mocked)
  app.get("/api/strategies/:userId", async (req, res) => {
    res.json([]);
  });

  // User API (mocked)
  app.get("/api/user/:id", async (req, res) => {
    res.json({ id: req.params.id, username: "mockuser" });
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
