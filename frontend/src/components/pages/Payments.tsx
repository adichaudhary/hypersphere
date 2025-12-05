import { useState } from "react";

const allPayments = [
  { id: "1", time: "2025-12-04 14:32:15", amount: "1,245.50", chain: "Solana", tip: "62.28", signature: "3Kx9...7mNp", status: "Confirmed" },
  { id: "2", time: "2025-12-04 14:28:42", amount: "892.00", chain: "Base", tip: "44.60", signature: "0x8f...3c2a", status: "Confirmed" },
  { id: "3", time: "2025-12-04 14:22:18", amount: "2,150.75", chain: "Solana", tip: "107.54", signature: "5Ty2...9pLm", status: "Confirmed" },
  { id: "4", time: "2025-12-04 14:15:33", amount: "675.25", chain: "Ethereum", tip: "33.76", signature: "0x1a...5d8b", status: "Confirmed" },
  { id: "5", time: "2025-12-04 14:08:09", amount: "1,520.00", chain: "Solana", tip: "76.00", signature: "7Qw4...2hRt", status: "Confirmed" },
  { id: "6", time: "2025-12-04 13:58:21", amount: "3,200.50", chain: "Base", tip: "160.03", signature: "0x9c...7e4f", status: "Confirmed" },
  { id: "7", time: "2025-12-04 13:45:55", amount: "450.00", chain: "Solana", tip: "22.50", signature: "2Mn8...4kVx", status: "Confirmed" },
  { id: "8", time: "2025-12-04 13:32:14", amount: "1,875.25", chain: "Solana", tip: "93.76", signature: "6Pk5...1wCn", status: "Confirmed" },
  { id: "9", time: "2025-12-03 18:45:33", amount: "920.00", chain: "Base", tip: "46.00", signature: "0x3b...9f1c", status: "Confirmed" },
  { id: "10", time: "2025-12-03 17:22:10", amount: "1,340.75", chain: "Solana", tip: "67.04", signature: "4Lp7...3vRw", status: "Confirmed" },
  { id: "11", time: "2025-12-03 16:15:28", amount: "2,890.50", chain: "Ethereum", tip: "144.53", signature: "0x7c...2a8d", status: "Confirmed" },
  { id: "12", time: "2025-12-03 15:08:42", amount: "560.25", chain: "Solana", tip: "28.01", signature: "8Nx5...6kTm", status: "Confirmed" },
];

export function Payments() {
  const [chainFilter, setChainFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("Today");
  const [tipFilter, setTipFilter] = useState<string>("All");

  const filteredPayments = allPayments.filter((payment) => {
    if (chainFilter !== "All" && payment.chain !== chainFilter) return false;
    if (tipFilter === "With Tip" && parseFloat(payment.tip) === 0) return false;
    if (tipFilter === "No Tip" && parseFloat(payment.tip) > 0) return false;
    if (dateRange === "Today" && !payment.time.startsWith("2025-12-04")) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-[#A5B6C8] mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-[#A5B6C8] mb-2">Chain</label>
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]"
            >
              <option>All</option>
              <option>Solana</option>
              <option>Base</option>
              <option>Ethereum</option>
            </select>
          </div>

          <div>
            <label className="block text-[#A5B6C8] mb-2">Tip</label>
            <select
              value={tipFilter}
              onChange={(e) => setTipFilter(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]"
            >
              <option>All</option>
              <option>With Tip</option>
              <option>No Tip</option>
            </select>
          </div>

          <div>
            <label className="block text-[#A5B6C8] mb-2">Amount Range</label>
            <select className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]">
              <option>All</option>
              <option>$0 - $500</option>
              <option>$500 - $1,000</option>
              <option>$1,000 - $5,000</option>
              <option>$5,000+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-[#A5B6C8]">
          Showing {filteredPayments.length} confirmed payment{filteredPayments.length !== 1 ? "s" : ""}
        </div>
        <button className="px-4 py-2 bg-[#00E7FF]/10 text-[#00E7FF] rounded-lg hover:bg-[#00E7FF]/20 transition-colors">
          Export Data
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B0D0F]">
              <tr>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Time</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Amount (USDC)</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Chain</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Tip</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Transaction Signature</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Status</th>
                <th className="px-6 py-4 text-left text-[#A5B6C8]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2228]">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[#1F2228]/50 transition-colors">
                  <td className="px-6 py-4 text-[#E7ECEF]">{payment.time}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">${payment.amount}</td>
                  <td className="px-6 py-4 text-[#00E7FF]">{payment.chain}</td>
                  <td className="px-6 py-4 text-[#E7ECEF]">${payment.tip}</td>
                  <td className="px-6 py-4 text-[#A5B6C8]">{payment.signature}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#00E7FF]/10 text-[#00E7FF] rounded-full">
                      {payment.status}
                    </span>
                  </td>
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
