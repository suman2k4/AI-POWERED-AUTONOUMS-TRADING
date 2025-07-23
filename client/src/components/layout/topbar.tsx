import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";

export function TopBar() {
  const { isConnected } = useWebSocket();

  return (
    <header className="dark-card border-b dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-green animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-gray-400">
              {isConnected ? 'Market Open' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              type="text" 
              placeholder="Search stocks, ETFs..." 
              className="w-80 bg-slate-700/50 border-dark-border pl-10 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-red rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
