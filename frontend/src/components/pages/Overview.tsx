import { MetricCard } from "../MetricCard";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState } from "react";

const chainData = [
  { name: "Solana", value: 72, color: "#00E7FF" },
  { name: "Base", value: 20, color: "#3457FF" },
  { name: "Ethereum", value: 8, color: "#7B93FF" },
];

const salesData24h = [
  { time: "00:00", value: 1200 },
  { time: "04:00", value: 800 },
  { time: "08:00", value: 2400 },
  { time: "12:00", value: 3600 },
  { time: "16:00", value: 4200 },
  { time: "20:00", value: 3800 },
];

const salesData7d = [
  { time: "Mon", value: 12000 },
  { time: "Tue", value: 15000 },
  { time: "Wed", value: 18000 },
  { time: "Thu", value: 16000 },
  { time: "Fri", value: 22000 },
  { time: "Sat", value: 25000 },
  { time: "Sun", value: 20000 },
];

const salesData30d = [
  { time: "Week 1", value: 65000 },
  { time: "Week 2", value: 72000 },
  { time: "Week 3", value: 85000 },
  { time: "Week 4", value: 92000 },
];

const transactions = [
  { time: "14:32:15", amount: "1,245.50", chain: "Solana", tip: "62.28", signature: "3Kx9...7mNp", status: "Confirmed" },
  { time: "14:28:42", amount: "892.00", chain: "Base", tip: "44.60", signature: "0x8f...3c2a", status: "Confirmed" },
  { time: "14:22:18", amount: "2,150.75", chain: "Solana", tip: "107.54", signature: "5Ty2...9pLm", status: "Confirmed" },
  { time: "14:15:33", amount: "675.25", chain: "Ethereum", tip: "33.76", signature: "0x1a...5d8b", status: "Confirmed" },
  { time: "14:08:09", amount: "1,520.00", chain: "Solana", tip: "76.00", signature: "7Qw4...2hRt", status: "Confirmed" },
  { time: "13:58:21", amount: "3,200.50", chain: "Base", tip: "160.03", signature: "0x9c...7e4f", status: "Confirmed" },
  { time: "13:45:55", amount: "450.00", chain: "Solana", tip: "22.50", signature: "2Mn8...4kVx", status: "Confirmed" },
  { time: "13:32:14", amount: "1,875.25", chain: "Solana", tip: "93.76", signature: "6Pk5...1wCn", status: "Confirmed" },
];

export function Overview() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  
  const getSalesData = () => {
    switch (timeRange) {
      case "24h": return salesData24h;
      case "7d": return salesData7d;
      case "30d": return salesData30d;
    }
  };

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-6">
        <MetricCard title="Total Sales Today" value="$24,532.50" subtitle="+12.5% from yesterday" />
        <MetricCard title="Transactions Today" value="847" subtitle="+8.2% from yesterday" />
        <MetricCard title="Average Order Value" value="$28.97" subtitle="+3.1% from yesterday" />
        <MetricCard title="Returning Customer %" value="42.8%" subtitle="+2.4% from last week" />
        <MetricCard title="Peak Transaction Time" value="16:00 – 18:00" subtitle="328 transactions" />
        <MetricCard title="Multi-Chain USDC" value="$892,450" subtitle="Solana 72% · Base 20% · Ethereum 8%" />
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
              {transactions.map((tx, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
