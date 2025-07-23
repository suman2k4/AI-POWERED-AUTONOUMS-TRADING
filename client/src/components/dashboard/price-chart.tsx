import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { generateMockChartData } from "@/lib/mock-data";

declare global {
  interface Window {
    Chart: any;
  }
}

export function PriceChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [timeframe, setTimeframe] = useState("1D");
  const [isChartLoaded, setIsChartLoaded] = useState(false);

  useEffect(() => {
    // Load Chart.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      setIsChartLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!isChartLoaded || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const mockData = generateMockChartData(30);

    const config = {
      type: 'line',
      data: {
        labels: mockData.map(d => d.x),
        datasets: [{
          label: 'Portfolio Value',
          data: mockData.map(d => d.y),
          borderColor: 'hsl(199, 89%, 48%)',
          backgroundColor: 'hsla(199, 89%, 48%, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'hsl(199, 89%, 48%)',
          pointBorderColor: 'hsl(199, 89%, 48%)',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: 'hsl(199, 89%, 48%)',
          pointRadius: 0,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'hsl(215, 25%, 18%)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'hsl(215, 20%, 33%)',
            borderWidth: 1,
            callbacks: {
              label: function(context: any) {
                return `Value: $${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'hsl(215, 20%, 33%)',
              borderColor: 'hsl(215, 20%, 33%)'
            },
            ticks: {
              color: 'hsl(240, 5%, 64.9%)'
            }
          },
          y: {
            grid: {
              color: 'hsl(215, 20%, 33%)',
              borderColor: 'hsl(215, 20%, 33%)'
            },
            ticks: {
              color: 'hsl(240, 5%, 64.9%)',
              callback: function(value: any) {
                return '$' + (value / 1000) + 'K';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    if (window.Chart) {
      chartInstance.current = new window.Chart(ctx, config);
    }
  }, [isChartLoaded, timeframe]);

  const timeframes = ["1D", "7D", "1M", "1Y"];

  return (
    <Card className="lg:col-span-2 dark-card border-dark-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
            <p className="text-gray-400 text-sm">Last 30 days</p>
          </div>
          <div className="flex items-center space-x-2">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className={
                  timeframe === tf 
                    ? "bg-primary-blue text-white hover:bg-blue-600" 
                    : "text-gray-400 hover:text-white hover:bg-slate-700/50"
                }
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-80">
          {isChartLoaded ? (
            <canvas ref={chartRef} className="w-full h-full"></canvas>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading chart...</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
