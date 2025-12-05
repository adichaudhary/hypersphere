import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const balances = [
  { chain: "Solana", balance: "642,564.25", percentage: 72, address: "7Kx9...3mNp" },
  { chain: "Base", balance: "178,490.00", percentage: 20, address: "0x8f...2c2a" },
  { chain: "Ethereum", balance: "71,395.75", percentage: 8, address: "0x1a...8d8b" },
];

const inflowData = [
  { day: "Mon", amount: 45000 },
  { day: "Tue", amount: 52000 },
  { day: "Wed", amount: 61000 },
  { day: "Thu", amount: 58000 },
  { day: "Fri", amount: 72000 },
  { day: "Sat", amount: 85000 },
  { day: "Sun", amount: 68000 },
];

const chainComparisonData = [
  { chain: "Solana", balance: 642564 },
  { chain: "Base", balance: 178490 },
  { chain: "Ethereum", balance: 71395 },
];

export function Balances() {
  const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.balance.replace(/,/g, "")), 0);

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-[#00E7FF]/10 to-[#3457FF]/10 border border-[#00E7FF]/30 rounded-lg p-8">
        <div className="text-[#A5B6C8] mb-2">Total USDC Balance</div>
        <div className="text-[#E7ECEF] mb-4">${totalBalance.toLocaleString()}</div>
        <div className="text-[#00E7FF]">Across 3 chains</div>
      </div>

      {/* Chain Balances */}
      <div className="grid grid-cols-3 gap-6">
        {balances.map((balance) => (
          <div key={balance.chain} className="bg-[#121417] border border-[#1F2228] rounded-lg p-6 hover:border-[#00E7FF]/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[#00E7FF]">{balance.chain}</div>
              <div className="text-[#A5B6C8]">{balance.percentage}%</div>
            </div>
            <div className="text-[#E7ECEF] mb-2">${balance.balance}</div>
            <div className="text-[#A5B6C8] mb-4">{balance.address}</div>
            <div className="w-full bg-[#1F2228] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#00E7FF] to-[#3457FF] h-2 rounded-full"
                style={{ width: `${balance.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Historical Inflow */}
        <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
          <h3 className="text-[#E7ECEF] mb-6">7-Day Inflow History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inflowData}>
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
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#00E7FF"
                strokeWidth={2}
                dot={{ fill: "#00E7FF", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-Chain Balance Comparison */}
        <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
          <h3 className="text-[#E7ECEF] mb-6">Multi-Chain Balance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chainComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2228" />
              <XAxis dataKey="chain" stroke="#A5B6C8" />
              <YAxis stroke="#A5B6C8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#121417",
                  border: "1px solid #1F2228",
                  borderRadius: "8px",
                  color: "#E7ECEF",
                }}
              />
              <Bar dataKey="balance" fill="#00E7FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Balance Table */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#1F2228]">
          <h3 className="text-[#E7ECEF]">Balance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B0D0F]">
              <tr>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Chain</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Balance (USDC)</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Percentage</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Wallet Address</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2228]">
              {balances.map((balance) => (
                <tr key={balance.chain} className="hover:bg-[#1F2228]/50 transition-colors">
                  <td className="px-6 py-4 text-[#00E7FF]">{balance.chain}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">${balance.balance}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">{balance.percentage}%</td>
                  <td className="px-6 py-4 text-[#A5B6C8]">{balance.address}</td>
                  <td className="px-6 py-4">
                    <button className="text-[#00E7FF] hover:text-[#3457FF] transition-colors">
                      View Transactions
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
