import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const dailySalesData = [
  { day: "Mon", sales: 12000 },
  { day: "Tue", sales: 15000 },
  { day: "Wed", sales: 18000 },
  { day: "Thu", sales: 16000 },
  { day: "Fri", sales: 22000 },
  { day: "Sat", sales: 25000 },
  { day: "Sun", sales: 20000 },
];

const peakHourData = [
  { hour: "08:00", transactions: 45 },
  { hour: "10:00", transactions: 82 },
  { hour: "12:00", transactions: 156 },
  { hour: "14:00", transactions: 203 },
  { hour: "16:00", transactions: 328 },
  { hour: "18:00", transactions: 287 },
  { hour: "20:00", transactions: 145 },
  { hour: "22:00", transactions: 76 },
];

const chainPerformanceData = [
  { chain: "Solana", avgSpeed: "0.4s", volume: 642564, transactions: 4820 },
  { chain: "Base", avgSpeed: "2.1s", volume: 178490, transactions: 1240 },
  { chain: "Ethereum", avgSpeed: "12.3s", volume: 71395, transactions: 380 },
];

export function Analytics() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
          <div className="text-[#A5B6C8] mb-2">Total Revenue (7d)</div>
          <div className="text-[#E7ECEF] mb-1">$128,000</div>
          <div className="text-[#00E7FF]">+15.3%</div>
        </div>
        <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
          <div className="text-[#A5B6C8] mb-2">Total Transactions (7d)</div>
          <div className="text-[#E7ECEF] mb-1">6,440</div>
          <div className="text-[#00E7FF]">+12.8%</div>
        </div>
        <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
          <div className="text-[#A5B6C8] mb-2">Avg Transaction Value</div>
          <div className="text-[#E7ECEF] mb-1">$19.88</div>
          <div className="text-[#00E7FF]">+2.1%</div>
        </div>
      </div>

      {/* Daily Sales Bar Chart */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
        <h3 className="text-[#E7ECEF] mb-6">Daily Sales (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailySalesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2228" />
            <XAxis dataKey="day" stroke="#A5B6C8" />
            <YAxis stroke="#A5B6C8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121417",
                border: "1px solid #1F2228",
                borderRadius: "8px",
                color: "#E7ECEF",
              }}
            />
            <Bar dataKey="sales" fill="#00E7FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Hour Histogram */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
        <h3 className="text-[#E7ECEF] mb-6">Peak Transaction Hours</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={peakHourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2228" />
            <XAxis dataKey="hour" stroke="#A5B6C8" />
            <YAxis stroke="#A5B6C8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121417",
                border: "1px solid #1F2228",
                borderRadius: "8px",
                color: "#E7ECEF",
              }}
            />
            <Bar dataKey="transactions" fill="#00E7FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chain Performance Table */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#1F2228]">
          <h3 className="text-[#E7ECEF]">Chain Performance Analytics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B0D0F]">
              <tr>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Chain</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Avg Confirmation Speed</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Total Volume (USDC)</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Total Transactions</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Avg Transaction Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2228]">
              {chainPerformanceData.map((chain) => (
                <tr key={chain.chain} className="hover:bg-[#1F2228]/50 transition-colors">
                  <td className="px-6 py-4 text-[#00E7FF]">{chain.chain}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">{chain.avgSpeed}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">${chain.volume.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">{chain.transactions.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">
                    ${(chain.volume / chain.transactions).toFixed(2)}
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