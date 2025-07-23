import { Link, useLocation } from "wouter";
import { 
  ChartPie, 
  Briefcase, 
  ArrowLeftRight, 
  Brain, 
  History, 
  Bot,
  TrendingUp,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { path: "/", label: "Dashboard", icon: ChartPie },
  { path: "/portfolio", label: "Portfolio", icon: Briefcase },
  { path: "/trading", label: "Trading", icon: ArrowLeftRight },
  { path: "/strategies", label: "AI Strategies", icon: Brain },
  { path: "/backtest", label: "Backtesting", icon: History },
  { path: "/chat", label: "AI Assistant", icon: Bot },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 dark-card border-r dark-border flex-shrink-0">
      {/* Header */}
      <div className="p-6 border-b dark-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TradePro</h1>
            <p className="text-xs text-gray-400">Professional Trading</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                isActive 
                  ? "bg-primary-blue/20 text-primary-blue border border-primary-blue/30" 
                  : "text-gray-300 hover:bg-slate-700/50"
              )}>
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark-border dark-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-blue to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-gray-400 truncate">Pro Trader</p>
          </div>
          <Settings className="text-gray-400 hover:text-white cursor-pointer" size={16} />
        </div>
      </div>
    </aside>
  );
}
