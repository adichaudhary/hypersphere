import { useState, useEffect } from 'react';
import { StatsCard } from './components/stats-card';
import { RevenueChart } from './components/revenue-chart';
import { TransactionsTable } from './components/transactions-table';
import { DarkModeToggle } from './components/dark-mode-toggle';
import { DollarSign, TrendingUp, Activity, Zap } from 'lucide-react';

interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  usdValue: number;
  status: 'completed' | 'pending' | 'failed';
  walletAddress: string;
}

interface ChartDataPoint {
  time: string;
  revenue: number;
}

type TimeFrame = '1h' | '1d' | '1m' | '1y';

// Mock SOL to USD rate
const USDC_TO_USD = 1.00;

// Generate initial mock transactions across different time periods
const generateInitialTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = Date.now();
  
  // Recent transactions (last hour)
  for (let i = 0; i < 15; i++) {
    const amount = Math.random() * 2 + 0.1;
    transactions.push({
      id: `tx_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(now - i * 300000), // 5 minutes apart
      amount: parseFloat(amount.toFixed(4)),
      usdValue: parseFloat((amount * USDC_TO_USD).toFixed(2)),
      status: 'completed',
      walletAddress: `${Math.random().toString(36).substring(2, 4)}...${Math.random().toString(36).substring(2, 4)}`
    });
  }
  
  // Additional transactions for longer time frames
  for (let i = 0; i < 50; i++) {
    const amount = Math.random() * 2 + 0.1;
    const daysAgo = Math.random() * 30; // Up to 30 days ago
    transactions.push({
      id: `tx_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(now - daysAgo * 86400000),
      amount: parseFloat(amount.toFixed(4)),
      usdValue: parseFloat((amount * USDC_TO_USD).toFixed(2)),
      status: 'completed',
      walletAddress: `${Math.random().toString(36).substring(2, 4)}...${Math.random().toString(36).substring(2, 4)}`
    });
  }
  
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Generate chart data based on timeframe
const generateChartData = (transactions: Transaction[], timeFrame: TimeFrame): ChartDataPoint[] => {
  const now = new Date();
  const dataPoints: ChartDataPoint[] = [];
  
  switch (timeFrame) {
    case '1h': {
      // Last hour, 5-minute intervals
      for (let i = 11; i >= 0; i--) {
        const intervalStart = new Date(now.getTime() - i * 300000);
        const intervalEnd = new Date(intervalStart.getTime() + 300000);
        
        const intervalTransactions = transactions.filter(tx => 
          tx.timestamp >= intervalStart && tx.timestamp < intervalEnd
        );
        
        const revenue = intervalTransactions.reduce((sum, tx) => sum + tx.usdValue, 0);
        
        dataPoints.push({
          time: intervalStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          revenue: parseFloat(revenue.toFixed(2))
        });
      }
      break;
    }
    case '1d': {
      // Last 24 hours, hourly intervals
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now.getTime() - i * 3600000);
        const hourEnd = new Date(hourStart.getTime() + 3600000);
        
        const hourTransactions = transactions.filter(tx => 
          tx.timestamp >= hourStart && tx.timestamp < hourEnd
        );
        
        const revenue = hourTransactions.reduce((sum, tx) => sum + tx.usdValue, 0);
        
        dataPoints.push({
          time: hourStart.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
          revenue: parseFloat(revenue.toFixed(2))
        });
      }
      break;
    }
    case '1m': {
      // Last 30 days, daily intervals
      for (let i = 29; i >= 0; i--) {
        const dayStart = new Date(now.getTime() - i * 86400000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        
        const dayTransactions = transactions.filter(tx => 
          tx.timestamp >= dayStart && tx.timestamp < dayEnd
        );
        
        const revenue = dayTransactions.reduce((sum, tx) => sum + tx.usdValue, 0);
        
        dataPoints.push({
          time: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: parseFloat(revenue.toFixed(2))
        });
      }
      break;
    }
    case '1y': {
      // Last 12 months, monthly intervals
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthTransactions = transactions.filter(tx => 
          tx.timestamp >= monthStart && tx.timestamp < monthEnd
        );
        
        const revenue = monthTransactions.reduce((sum, tx) => sum + tx.usdValue, 0);
        
        dataPoints.push({
          time: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          revenue: parseFloat(revenue.toFixed(2))
        });
      }
      break;
    }
  }
  
  return dataPoints;
};

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(generateInitialTransactions());
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1d');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Calculate totals
  const totalTransactions = transactions.length;
  const totalSolReceived = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalUsdValue = transactions.reduce((sum, tx) => sum + tx.usdValue, 0);

  // Update chart data when transactions or timeframe changes
  useEffect(() => {
    setChartData(generateChartData(transactions, timeFrame));
  }, [transactions, timeFrame]);

  // Simulate new transactions coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldAddTransaction = Math.random() > 0.3; // 70% chance of new transaction
      
      if (shouldAddTransaction) {
        const amount = Math.random() * 50 + 0.50; // Between 0.50 and 50.5 USDC (mock)
        const newTransaction: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date(),
          amount: parseFloat(amount.toFixed(4)),
          usdValue: parseFloat((amount * USDC_TO_USD).toFixed(2)),
          status: 'completed',
          walletAddress: `${Math.random().toString(36).substring(2, 4)}...${Math.random().toString(36).substring(2, 4)}`
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const timeFrameButtons: { value: TimeFrame; label: string }[] = [
    { value: '1h', label: '1H' },
    { value: '1d', label: '1D' },
    { value: '1m', label: '1M' },
    { value: '1y', label: '1Y' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50'
    }`}>
      {/* Header */}
      <header className={`border-b shadow-sm backdrop-blur-sm transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-700/80' 
          : 'bg-white border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`flex items-center gap-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Merchant Payment Dashboard
                </h1>
                <p className={`mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Real-time transaction analytics and insights (USDC on Solana)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Transactions"
            value={totalTransactions.toString()}
            icon={Activity}
            trend="+12.3%"
            trendUp={true}
            isDark={isDarkMode}
          />
          <StatsCard
            title="Total USDC Received"
            value={`${totalUsdcReceived.toFixed(2)} USDC`}
            icon={TrendingUp}
            trend="+8.7%"
            trendUp={true}
            isDark={isDarkMode}
          />
          <StatsCard
            title="USD Value"
            value={`$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend="+15.2%"
            trendUp={true}
            subtitle={`1 USDC = $${USDC_TO_USD.toFixed(2)}`}
            isDark={isDarkMode}
          />
        </div>

        {/* Revenue Chart */}
        <div className={`rounded-xl shadow-sm border p-6 mb-8 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-700/80' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className={`transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>Revenue Over Time</h2>
              <p className={`mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {timeFrame === '1h' && 'Last hour'}
                {timeFrame === '1d' && 'Last 24 hours'}
                {timeFrame === '1m' && 'Last 30 days'}
                {timeFrame === '1y' && 'Last 12 months'}
              </p>
            </div>
            <div className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              {timeFrameButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setTimeFrame(btn.value)}
                  className={`px-4 py-2 rounded-md transition-all ${
                    timeFrame === btn.value
                      ? isDarkMode
                        ? 'bg-slate-700 text-indigo-400 shadow-sm border border-slate-600'
                        : 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart data={chartData} isDark={isDarkMode} />
        </div>

        {/* Transactions Table */}
        <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-700/80' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="mb-6">
            <h2 className={`transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>Recent Transactions</h2>
            <p className={`mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>Live transaction feed</p>
          </div>
          <TransactionsTable transactions={transactions.slice(0, 10)} isDark={isDarkMode} />
        </div>
      </main>
    </div>
  );
}