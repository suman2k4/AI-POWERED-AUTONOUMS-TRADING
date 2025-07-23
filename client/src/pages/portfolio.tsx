import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Position, Stock } from "@shared/schema";
import { TrendingUp, TrendingDown } from "lucide-react";

type PositionWithStock = Position & { stock: Stock };

export default function Portfolio() {
  const { data: positions, isLoading, error } = useQuery<PositionWithStock[]>({
    queryKey: ["/api/positions/1"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="dark-card border-dark-border">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-600 rounded mb-4 w-32"></div>
                  <div className="h-4 bg-gray-600 rounded mb-2 w-48"></div>
                  <div className="h-4 bg-gray-600 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <p className="text-gray-400">Unable to load portfolio positions</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <p className="text-gray-400">No positions in your portfolio</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Portfolio</h1>
      
      <div className="grid gap-4">
        {positions.map((position) => {
          const gainLoss = parseFloat(position.gainLoss);
          const gainLossPercent = parseFloat(position.gainLossPercent);
          const currentValue = parseFloat(position.currentValue);
          const averagePrice = parseFloat(position.averagePrice);
          const isPositive = gainLoss >= 0;

          return (
            <Card key={position.id} className="dark-card border-dark-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-blue to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {position.stock.symbol}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {position.stock.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {position.quantity} shares @ ${averagePrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">
                      ${currentValue.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2">
                      {isPositive ? (
                        <TrendingUp size={16} className="text-success-green" />
                      ) : (
                        <TrendingDown size={16} className="text-error-red" />
                      )}
                      <span className={`font-medium ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
                        {isPositive ? '+' : ''}${gainLoss.toFixed(2)} ({isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
