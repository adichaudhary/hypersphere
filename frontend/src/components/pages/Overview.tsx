import { MetricCard } from "../MetricCard";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { fetchMerchantPayments, formatAmount, formatTxSignature, type Payment } from "../../utils/api";

// Merchant ID - update this with your actual merchant wallet address
const MERCHANT_ID = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U";

export function Overview() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch payments from backend
  useEffect(() => {
    async function loadPayments() {
      try {
        const data = await fetchMerchantPayments(MERCHANT_ID);
        setPayments(data.payments);
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate metrics from real data
  const totalSales = payments.reduce((sum, p) => sum + p.amount, 0);
  const transactionCount = payments.length;
  const avgOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0;
  
  // Get today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = payments.filter(p => new Date(p.created_at) >= today);
  const totalSalesToday = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const transactionsToday = todayPayments.length;

  // Chain distribution (dummy data for now as currency info might not be complete)
  const chainData = [
    { name: "Solana", value: 100, color: "#00E7FF" },
  ];

  // Sales data (simplified - showing actual payment times)
  const salesData24h = Array.from({ length: 6 }, (_, i) => ({
    time: `${i * 4}:00`,
    value: 0
  }));

  const salesData7d = Array.from({ length: 7 }, (_, i) => ({
    time: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    value: 0
  }));

  const salesData30d = Array.from({ length: 4 }, (_, i) => ({
    time: `Week ${i + 1}`,
    value: 0
  }));
  
  const getSalesData = () => {
    switch (timeRange) {
      case "24h": return salesData24h;
      case "7d": return salesData7d;
      case "30d": return salesData30d;
    }
  };

  // Get latest 8 transactions for display
  const recentTransactions = payments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(payment => ({
      time: new Date(payment.created_at).toLocaleTimeString('en-US', { hour12: false }),
      amount: formatAmount(payment.amount),
      chain: payment.currency || "Solana",
      tip: "0.00",
      signature: formatTxSignature(payment.tx_signature),
      status: payment.status === "paid" ? "Confirmed" : "Pending",
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#A5B6C8]">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-6">
        <MetricCard 
          title="Total Sales Today" 
          value={`$${formatAmount(totalSalesToday)}`} 
          subtitle={`${transactionsToday} transactions`} 
        />
        <MetricCard 
          title="Total Transactions" 
          value={transactionCount.toString()} 
          subtitle="All time" 
        />
        <MetricCard 
          title="Average Order Value" 
          value={`$${formatAmount(avgOrderValue)}`} 
          subtitle="Per transaction" 
        />
        <MetricCard 
          title="Total Volume" 
          value={`$${formatAmount(totalSales)}`} 
          subtitle="All time sales" 
        />
        <MetricCard 
          title="Payment Status" 
          value={payments.filter(p => p.status === "paid").length.toString()} 
          subtitle={`${payments.filter(p => p.status !== "paid").length} pending`} 
        />
        <MetricCard 
          title="Multi-Chain USDC" 
          value={`$${formatAmount(totalSales)}`} 
          subtitle="Solana 100%" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* USDC Distribution Pie Chart */}
        <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
          <h3 className="text-[#E7ECEF] mb-6">USDC Distribution by Chain</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chainData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chainData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#121417",
                  border: "1px solid #1F2228",
                  borderRadius: "8px",
                  color: "#E7ECEF",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {chainData.map((chain) => (
              <div key={chain.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chain.color }} />
                <span className="text-[#A5B6C8]">{chain.name} {chain.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Volume Line Chart */}
        <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#E7ECEF]">Sales Volume Over Time</h3>
            <div className="flex gap-2">
              {(["24h", "7d", "30d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded ${
                    timeRange === range
                      ? "bg-[#00E7FF]/10 text-[#00E7FF]"
                      : "text-[#A5B6C8] hover:bg-[#1F2228]"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getSalesData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2228" />
              <XAxis dataKey="time" stroke="#A5B6C8" />
              <YAxis stroke="#A5B6C8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#121417",
                  border: "1px solid #1F2228",
                  borderRadius: "8px",
                  color: "#E7ECEF",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00E7FF"
                strokeWidth={2}
                dot={{ fill: "#00E7FF", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#1F2228]">
          <h3 className="text-[#E7ECEF]">Confirmed Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B0D0F]">
              <tr>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Time</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Amount (USDC)</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Chain</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Tip</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Transaction Signature</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2228]">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-[#1F2228]/50 transition-colors">
                    <td className="px-6 py-4 text-[#E7ECEF]">{tx.time}</td>
                    <td className="px-6 py-4 text-[#E7ECEF]">${tx.amount}</td>
                    <td className="px-6 py-4 text-[#00E7FF]">{tx.chain}</td>
                    <td className="px-6 py-4 text-[#E7ECEF]">${tx.tip}</td>
                    <td className="px-6 py-4 text-[#A5B6C8]">{tx.signature}</td>
                    <td className="px-6 py-4">
                      <button className="text-[#00E7FF] hover:text-[#3457FF] transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#A5B6C8]">
                    No transactions yet. Process a payment from your Android terminal to see data here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
