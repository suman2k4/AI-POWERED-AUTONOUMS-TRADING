import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import { PriceChart } from "@/components/dashboard/price-chart";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { TopMovers } from "@/components/dashboard/top-movers";
import { AIInsights } from "@/components/dashboard/ai-insights";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <PortfolioOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PriceChart />
        <RecentTrades />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopMovers />
        <AIInsights />
      </div>
    </div>
  );
}
