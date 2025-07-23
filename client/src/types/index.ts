export interface WebSocketMessage {
  type: 'connection' | 'price_update' | 'portfolio_update' | 'trade_update' | 'error';
  data?: any;
  message?: string;
}

export interface PriceUpdate {
  symbol: string;
  priceChange: number;
  percentChange: number;
  timestamp: string;
}

export interface PortfolioUpdate {
  totalValue: string;
  dayGain: string;
  dayGainPercent: string;
}

export interface ChartDataPoint {
  x: string | Date;
  y: number;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  component: string;
}
