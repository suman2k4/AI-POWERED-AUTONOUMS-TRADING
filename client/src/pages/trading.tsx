import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Stock } from "@shared/schema";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { TradeModal } from "@/components/trading/trade-modal";

export default function Trading() {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const { data: stocks, isLoading, error } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Trading</h1>
          <Button className="bg-primary-blue hover:bg-blue-600">
            <Plus size={16} className="mr-2" />
            New Trade
          </Button>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="dark-card border-dark-border">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-600 rounded mb-4 w-20"></div>
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Trading</h1>
          <Button 
            className="bg-primary-blue hover:bg-blue-600"
            onClick={() => setIsTradeModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            New Trade
          </Button>
        </div>
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <p className="text-gray-400">Unable to load market data</p>
          </CardContent>
        </Card>
        <TradeModal open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen} />
      </div>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Trading</h1>
          <Button 
            className="bg-primary-blue hover:bg-blue-600"
            onClick={() => setIsTradeModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            New Trade
          </Button>
        </div>
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <p className="text-gray-400">No stocks available for trading</p>
          </CardContent>
        </Card>
        <TradeModal open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Trading</h1>
        <Button 
          className="bg-primary-blue hover:bg-blue-600"
          onClick={() => setIsTradeModalOpen(true)}
        >
          <Plus size={16} className="mr-2" />
          New Trade
        </Button>
      </div>
      
      <div className="grid gap-4">
        {stocks.map((stock) => {
          const changePercent = parseFloat(stock.changePercent);
          const currentPrice = parseFloat(stock.currentPrice);
          const isPositive = changePercent >= 0;

          return (
            <Card key={stock.id} className="dark-card border-dark-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-blue to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {stock.symbol}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {stock.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {stock.sector} • Volume: {stock.volume?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        ${currentPrice.toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-2">
                        {isPositive ? (
                          <TrendingUp size={16} className="text-success-green" />
                        ) : (
                          <TrendingDown size={16} className="text-error-red" />
                        )}
                        <span className={`font-medium ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
                          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-success-green hover:bg-green-600 text-white"
                        onClick={() => setIsTradeModalOpen(true)}
                      >
                        Buy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-error-red text-error-red hover:bg-error-red hover:text-white"
                        onClick={() => setIsTradeModalOpen(true)}
                      >
                        Sell
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TradeModal open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen} />
    </div>
  );
}
