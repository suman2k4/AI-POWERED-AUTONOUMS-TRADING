import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { AiInsight } from "@shared/schema";
import { Lightbulb, AlertTriangle, TrendingUp, Bot } from "lucide-react";
import { Link } from "wouter";

export function AIInsights() {
  const { data: insights, isLoading, error } = useQuery<AiInsight[]>({
    queryKey: ["/api/ai-insights/1"],
  });

  if (isLoading) {
    return (
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white">AI Trading Insights</h3>
              <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-gray-600 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-32"></div>
                      <div className="h-3 bg-gray-600 rounded w-full"></div>
                      <div className="h-3 bg-gray-600 rounded w-24"></div>
                    </div>
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
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white">AI Trading Insights</h3>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-400">Unable to load AI insights</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className="dark-card border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-white">AI Trading Insights</h3>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-400">No AI insights available</p>
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'OPTIMIZATION':
        return <Lightbulb className="text-success-green mt-1" size={16} />;
      case 'RISK_ALERT':
        return <AlertTriangle className="text-warning-orange mt-1" size={16} />;
      case 'OPPORTUNITY':
        return <TrendingUp className="text-primary-blue mt-1" size={16} />;
      default:
        return <Bot className="text-gray-400 mt-1" size={16} />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'OPTIMIZATION':
        return 'border-success-green';
      case 'RISK_ALERT':
        return 'border-warning-orange';
      case 'OPPORTUNITY':
        return 'border-primary-blue';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <Card className="dark-card border-dark-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-white">AI Trading Insights</h3>
            <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse"></div>
          </div>
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="text-primary-blue hover:underline">
              View Assistant
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {insights.slice(0, 3).map((insight) => (
            <div key={insight.id} className={`bg-slate-700/30 rounded-lg p-4 border-l-4 ${getBorderColor(insight.type)}`}>
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">{insight.title}</h4>
                  <p className="text-gray-300 text-sm mb-2">{insight.message}</p>
                  <div className="flex items-center justify-between">
                    {insight.confidence && (
                      <p className="text-gray-400 text-xs">
                        Confidence: {insight.confidence}%
                      </p>
                    )}
                    {insight.riskLevel && (
                      <p className="text-gray-400 text-xs">
                        Risk Level: {insight.riskLevel}
                      </p>
                    )}
                    {insight.timeframe && (
                      <p className="text-gray-400 text-xs">
                        Timeframe: {insight.timeframe}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
