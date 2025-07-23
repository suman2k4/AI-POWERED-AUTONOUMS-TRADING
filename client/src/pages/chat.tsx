import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { getRandomAIResponse } from "@/lib/mock-data";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  category?: 'general' | 'analysis' | 'alert' | 'recommendation';
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI trading assistant. I can help you with portfolio analysis, market insights, trading strategies, and answer any questions about your investments. How can I assist you today?',
      timestamp: new Date(),
      category: 'general'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useWebSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: getRandomAIResponse(),
        timestamp: new Date(),
        category: Math.random() > 0.5 ? 'analysis' : 'recommendation'
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (category?: string) => {
    switch (category) {
      case 'analysis':
        return <TrendingUp className="text-primary-blue" size={16} />;
      case 'alert':
        return <AlertTriangle className="text-warning-orange" size={16} />;
      case 'recommendation':
        return <Lightbulb className="text-success-green" size={16} />;
      default:
        return <Bot className="text-primary-blue" size={16} />;
    }
  };

  const quickActions = [
    "Analyze my portfolio performance",
    "What are the top market movers today?",
    "Should I rebalance my portfolio?",
    "Show me high-growth opportunities",
    "What's the market sentiment?",
    "Explain my risk exposure"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-green animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-gray-400 text-sm">
            {isConnected ? 'AI Online' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <Card className="lg:col-span-3 dark-card border-dark-border">
          <CardHeader className="border-b dark-border">
            <CardTitle className="text-white flex items-center space-x-2">
              <Bot className="text-primary-blue" size={20} />
              <span>TradePro AI Assistant</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <Avatar className={`w-8 h-8 ${message.type === 'user' ? 'bg-primary-blue' : 'bg-slate-700'}`}>
                      <AvatarFallback className="text-white">
                        {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-primary-blue text-white ml-auto'
                            : 'bg-slate-700/50 text-gray-100'
                        }`}
                      >
                        {message.type === 'ai' && message.category && (
                          <div className="flex items-center space-x-2 mb-2">
                            {getMessageIcon(message.category)}
                            <span className="text-xs text-gray-400 uppercase font-medium">
                              {message.category}
                            </span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 bg-slate-700">
                      <AvatarFallback className="text-white">
                        <Bot size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="border-t dark-border p-4 space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your portfolio, market trends, or trading strategies..."
                  className="flex-1 bg-slate-700/50 border-dark-border text-white placeholder-gray-400"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-primary-blue hover:bg-blue-600"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dark-card border-dark-border">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left text-gray-300 hover:text-white hover:bg-slate-700/50 h-auto py-2 px-3"
                onClick={() => setInputValue(action)}
              >
                <span className="text-xs">{action}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-blue/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-primary-blue" size={20} />
              </div>
              <h3 className="text-white font-semibold">Market Analysis</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Get real-time market insights, trend analysis, and technical indicators interpretation.
            </p>
          </CardContent>
        </Card>

        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-success-green/20 rounded-lg flex items-center justify-center">
                <Lightbulb className="text-success-green" size={20} />
              </div>
              <h3 className="text-white font-semibold">Smart Recommendations</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Receive personalized investment recommendations based on your portfolio and risk profile.
            </p>
          </CardContent>
        </Card>

        <Card className="dark-card border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-warning-orange/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-warning-orange" size={20} />
              </div>
              <h3 className="text-white font-semibold">Risk Management</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Monitor portfolio risk, identify potential threats, and get alerts for important market events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
