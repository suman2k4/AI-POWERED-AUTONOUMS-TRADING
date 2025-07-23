import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Stock } from "@shared/schema";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export function TopMovers() {
  const [viewMode, setViewMode] = useState<"gainers" | "losers">("gainers");

  const { data: stocks, isLoading, error } = useQuery<Stock[]>({
    queryKey: ["/api/stocks/top-movers"],
  });

  if (isLoading) {
    return (
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Top Movers</h3>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-16"></div>
                      <div className="h-3 bg-gray-600 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-16"></div>
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
            <h3 className="text-lg font-semibold text-white">Top Movers</h3>
          </div>
          <p className="text-gray-400">Unable to load market data</p>
        </CardContent>
      </Card>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Top Movers</h3>
          </div>
          <p className="text-gray-400">No market data available</p>
        </CardContent>
      </Card>
    );
  }

  const sortedStocks = [...stocks].sort((a, b) => {
    const aChange = parseFloat(a.changePercent);
    const bChange = parseFloat(b.changePercent);
    return viewMode === "gainers" ? bChange - aChange : aChange - bChange;
  });

  const displayStocks = sortedStocks.slice(0, 6);

  const getGradientColor = (symbol: string) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500", 
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-blue-500"
    ];
    return colors[symbol.charCodeAt(0) % colors.length];
  };

  return (
    <Card className="dark-card border-dark-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Top Movers</h3>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === "gainers" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("gainers")}
              className={
                viewMode === "gainers"
                  ? "bg-success-green text-white hover:bg-green-600"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }
            >
              Gainers
            </Button>
            <Button
              variant={viewMode === "losers" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("losers")}
              className={
                viewMode === "losers"
                  ? "bg-error-red text-white hover:bg-red-600"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }
            >
              Losers
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {displayStocks.map((stock) => {
            const changePercent = parseFloat(stock.changePercent);
            const currentPrice = parseFloat(stock.currentPrice);
            const isPositive = changePercent >= 0;
            
            return (
              <div key={stock.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-gradient-to-r ${getGradientColor(stock.symbol)} rounded-lg flex items-center justify-center`}>
                    <span className="text-white font-bold text-xs">
                      {stock.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{stock.symbol}</p>
                    <p className="text-gray-400 text-sm">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    ${currentPrice.toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <TrendingUp size={12} className="text-success-green" />
                    ) : (
                      <TrendingDown size={12} className="text-error-red" />
                    )}
                    <span className={`text-sm font-medium ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
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
