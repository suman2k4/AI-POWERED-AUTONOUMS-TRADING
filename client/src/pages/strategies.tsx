import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Strategy } from "@shared/schema";
import { Brain, TrendingUp, Play, Pause, Plus } from "lucide-react";

export default function Strategies() {
  const { data: strategies, isLoading, error } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies/1"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">AI Strategies</h1>
          <Button className="bg-primary-blue hover:bg-blue-600">
            <Plus size={16} className="mr-2" />
            Create Strategy
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="dark-card border-dark-border">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-600 rounded mb-4 w-32"></div>
                  <div className="h-4 bg-gray-600 rounded mb-2 w-full"></div>
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
          <h1 className="text-3xl font-bold text-white">AI Strategies</h1>
          <Button className="bg-primary-blue hover:bg-blue-600">
            <Plus size={16} className="mr-2" />
            Create Strategy
          </Button>
        </div>
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <p className="text-gray-400">Unable to load strategies</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock strategies if none exist
  const mockStrategies: Strategy[] = [
    {
      id: 1,
      userId: 1,
      name: "Momentum Trading",
      description: "Automated strategy that identifies and trades on momentum signals",
      parameters: { rsi_threshold: 70, volume_factor: 1.5 },
      performance: "12.4",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      userId: 1,
      name: "Mean Reversion",
      description: "Contrarian strategy that buys oversold and sells overbought stocks",
      parameters: { rsi_low: 30, rsi_high: 70 },
      performance: "8.7",
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      userId: 1,
      name: "Sector Rotation",
      description: "Rotates investments between sectors based on economic indicators",
      parameters: { lookback_period: 60, threshold: 0.05 },
      performance: "15.2",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const displayStrategies = strategies && strategies.length > 0 ? strategies : mockStrategies;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">AI Strategies</h1>
        <Button className="bg-primary-blue hover:bg-blue-600">
          <Plus size={16} className="mr-2" />
          Create Strategy
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayStrategies.map((strategy) => {
          const performance = strategy.performance ? parseFloat(strategy.performance) : 0;
          const isPositive = performance >= 0;

          return (
            <Card key={strategy.id} className="dark-card border-dark-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="text-primary-blue" size={20} />
                    <CardTitle className="text-white text-lg">
                      {strategy.name}
                    </CardTitle>
                  </div>
                  <Badge 
                    variant={strategy.isActive ? "default" : "secondary"}
                    className={strategy.isActive ? "bg-success-green" : "bg-gray-600"}
                  >
                    {strategy.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  {strategy.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Performance</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp 
                      size={14} 
                      className={isPositive ? "text-success-green" : "text-error-red"} 
                    />
                    <span className={`font-semibold ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
                      {isPositive ? '+' : ''}{performance}%
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant={strategy.isActive ? "destructive" : "default"}
                    className={strategy.isActive ? "bg-warning-orange hover:bg-orange-600" : "bg-success-green hover:bg-green-600"}
                  >
                    {strategy.isActive ? (
                      <>
                        <Pause size={14} className="mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" className="border-dark-border text-gray-300">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
