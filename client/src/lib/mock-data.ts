export const generateMockChartData = (points: number = 30) => {
  const data = [];
  const startValue = 95000;
  let currentValue = startValue;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < points; i++) {
    const monthIndex = i % 12;
    const change = (Math.random() - 0.4) * 5000; // Slight upward bias
    currentValue += change;
    
    data.push({
      x: months[monthIndex],
      y: Math.max(currentValue, startValue * 0.8) // Don't go below 80% of start value
    });
  }
  
  return data;
};

export const mockAIResponses = [
  "Based on your portfolio analysis, I recommend rebalancing your tech holdings. Apple (AAPL) is showing strong momentum for the next quarter.",
  "Market volatility is expected to increase this week. Consider implementing stop-loss orders on your high-risk positions.",
  "Your portfolio shows good diversification. However, I notice high correlation in your energy sector positions.",
  "Technical analysis suggests an oversold condition in semiconductor stocks. This could be a good entry point.",
  "The current market conditions favor defensive stocks. Consider increasing your allocation to utilities and consumer staples."
];

export const getRandomAIResponse = () => {
  return mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
};
