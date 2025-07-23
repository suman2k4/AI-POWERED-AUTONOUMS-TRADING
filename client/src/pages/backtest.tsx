import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, BarChart3, Play } from "lucide-react";

export default function Backtest() {
  const mockBacktestResults = [
    {
      id: 1,
      strategy: "Momentum Trading",
      period: "2023-01-01 to 2023-12-31",
      totalReturn: 15.4,
      sharpeRatio: 1.23,
      maxDrawdown: -8.2,
      winRate: 62.4,
      trades: 145,
    },
    {
      id: 2,
      strategy: "Mean Reversion",
      period: "2023-01-01 to 2023-12-31",
      totalReturn: 8.7,
      sharpeRatio: 0.89,
      maxDrawdown: -5.1,
      winRate: 58.3,
      trades: 203,
    },
    {
      id: 3,
      strategy: "Sector Rotation",
      period: "2023-01-01 to 2023-12-31",
      totalReturn: 22.1,
      sharpeRatio: 1.45,
      maxDrawdown: -12.4,
      winRate: 71.2,
      trades: 89,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Backtesting</h1>
      
      {/* Backtest Configuration */}
      <Card className="dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="text-primary-blue" size={20} />
            <span>New Backtest</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Strategy</Label>
              <Select>
                <SelectTrigger className="bg-slate-700/50 border-dark-border text-white">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent className="dark-card border-dark-border">
                  <SelectItem value="momentum">Momentum Trading</SelectItem>
                  <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                  <SelectItem value="sector-rotation">Sector Rotation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Start Date</Label>
              <Input 
                type="date" 
                className="bg-slate-700/50 border-dark-border text-white"
                defaultValue="2023-01-01"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">End Date</Label>
              <Input 
                type="date" 
                className="bg-slate-700/50 border-dark-border text-white"
                defaultValue="2023-12-31"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Initial Capital</Label>
              <Input 
                type="number" 
                placeholder="100000"
                className="bg-slate-700/50 border-dark-border text-white placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Commission per Trade</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                className="bg-slate-700/50 border-dark-border text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <Button className="bg-primary-blue hover:bg-blue-600">
            <Play size={16} className="mr-2" />
            Run Backtest
          </Button>
        </CardContent>
      </Card>
      
      {/* Backtest Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Recent Backtests</h2>
        
        <div className="grid gap-4">
          {mockBacktestResults.map((result) => (
            <Card key={result.id} className="dark-card border-dark-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {result.strategy}
                    </h3>
                    <p className="text-gray-400 text-sm">{result.period}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {result.totalReturn >= 0 ? (
                        <TrendingUp className="text-success-green" size={20} />
                      ) : (
                        <TrendingDown className="text-error-red" size={20} />
                      )}
                      <span className={`text-xl font-bold ${
                        result.totalReturn >= 0 ? 'text-success-green' : 'text-error-red'
                      }`}>
                        {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Sharpe Ratio</p>
                    <p className="text-white font-semibold">{result.sharpeRatio}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Max Drawdown</p>
                    <p className="text-error-red font-semibold">{result.maxDrawdown}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Win Rate</p>
                    <p className="text-white font-semibold">{result.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Total Trades</p>
                    <p className="text-white font-semibold">{result.trades}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" className="border-dark-border text-gray-300">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
