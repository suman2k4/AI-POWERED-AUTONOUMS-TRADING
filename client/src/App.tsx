import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import Trading from "@/pages/trading";
import Strategies from "@/pages/strategies";
import Backtest from "@/pages/backtest";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/trading" component={Trading} />
      <Route path="/strategies" component={Strategies} />
      <Route path="/backtest" component={Backtest} />
      <Route path="/chat" component={Chat} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen bg-dark-bg">
          <AppLayout>
            <Router />
          </AppLayout>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
