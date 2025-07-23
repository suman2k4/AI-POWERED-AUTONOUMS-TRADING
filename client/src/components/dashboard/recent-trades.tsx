import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Trade, Stock } from "@shared/schema";
import { TrendingUp, TrendingDown } from "lucide-react";

type TradeWithStock = Trade & { stock: Stock };

export function RecentTrades() {
  const { data: trades, isLoading, error } = useQuery<TradeWithStock[]>({
    queryKey: ["/api/trades/1"],
  });

  if (isLoading) {
    return (
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-24"></div>
                      <div className="h-3 bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-20"></div>
                    <div className="h-3 bg-gray-600 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
          </div>
          <p className="text-gray-400">Unable to load recent trades</p>
        </CardContent>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
          </div>
          <p className="text-gray-400">No recent trades</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark-card border-dark-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
          <Button variant="ghost" size="sm" className="text-primary-blue hover:underline">
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {trades.slice(0, 6).map((trade) => {
            const changePercent = parseFloat(trade.stock.changePercent);
            const isPositive = changePercent >= 0;
            const totalValue = parseFloat(trade.totalAmount);
            
            return (
              <div key={trade.id} className="flex items-center justify-between py-3 border-b border-dark-border last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    trade.type === 'BUY' 
                      ? 'bg-success-green/20' 
                      : 'bg-error-red/20'
                  }`}>
                    <span className={`font-semibold text-sm ${
                      trade.type === 'BUY' 
                        ? 'text-success-green' 
                        : 'text-error-red'
                    }`}>
                      {trade.stock.symbol}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{trade.stock.name}</p>
                    <p className="text-gray-400 text-sm">
                      {trade.type} {trade.quantity} shares
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">${totalValue.toLocaleString()}</p>
                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <TrendingUp size={12} className="text-success-green" />
                    ) : (
                      <TrendingDown size={12} className="text-error-red" />
                    )}
                    <span className={`text-sm ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
                      {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
