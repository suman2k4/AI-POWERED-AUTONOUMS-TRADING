import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Portfolio } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import { PortfolioUpdate } from "@/types";

export function PortfolioOverview() {
  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null);
  const { lastMessage } = useWebSocket();

  const { data: portfolio, isLoading } = useQuery<Portfolio>({
    queryKey: ["/api/portfolio/1"],
  });

  useEffect(() => {
    if (portfolio) {
      setPortfolioData(portfolio);
    }
  }, [portfolio]);

  useEffect(() => {
    if (lastMessage?.type === 'portfolio_update' && lastMessage.data) {
      const update: PortfolioUpdate = lastMessage.data;
      setPortfolioData(prev => prev ? {
        ...prev,
        totalValue: update.totalValue,
        dayGain: update.dayGain,
        dayGainPercent: update.dayGainPercent
      } : null);
    }
  }, [lastMessage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-4"></div>
                <div className="h-8 bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-600 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <p className="text-gray-400">Portfolio data not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dayGainValue = parseFloat(portfolioData.dayGain);
  const isPositive = dayGainValue >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Total Portfolio Value</h3>
            <TrendingUp className="text-success-green" size={20} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">${portfolioData.totalValue}</p>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
                {isPositive ? '+' : ''}{portfolioData.dayGainPercent}%
              </span>
              <span className="text-gray-400 text-sm">
                {isPositive ? '+' : ''}${portfolioData.dayGain} today
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Day's Gain/Loss</h3>
            {isPositive ? (
              <TrendingUp className="text-success-green" size={20} />
            ) : (
              <TrendingDown className="text-error-red" size={20} />
            )}
          </div>
          <div className="space-y-2">
            <p className={`text-3xl font-bold ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
              {isPositive ? '+' : ''}${portfolioData.dayGain}
            </p>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
                {isPositive ? '+' : ''}{portfolioData.dayGainPercent}%
              </span>
              <span className="text-gray-400 text-sm">vs. yesterday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Buying Power</h3>
            <Wallet className="text-primary-blue" size={20} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">${portfolioData.buyingPower}</p>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Available to trade</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Active Positions</h3>
            <List className="text-warning-orange" size={20} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">{portfolioData.activePositions}</p>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">8 profitable</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
