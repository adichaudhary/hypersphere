import { useState } from "react";

export function Settings() {
  const [businessName, setBusinessName] = useState("Hypersphere Merchant");
  const [businessEmail, setBusinessEmail] = useState("merchant@hypersphere.com");
  const [defaultTip, setDefaultTip] = useState("5");
  const [taxRate, setTaxRate] = useState("8.5");
  const [solanaAddress, setSolanaAddress] = useState("7Kx9mNpFh3Ty2VwQx8RpLm4Cn1Wv5Ht6Jk3Xs2Mn7Lp");
  const [baseAddress, setBaseAddress] = useState("0x8f3c2a9b7e1d5f4c6a8b2e9d1f3c5a7b9e2d4f6a");
  const [ethereumAddress, setEthereumAddress] = useState("0x1a5d8b3c2e9f7a4b6c8d1e3f5a7b9c2d4e6f8a1b");

  const handleSave = () => {
    // Mock save functionality
    alert("Settings saved successfully!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Business Profile */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
        <h3 className="text-[#E7ECEF] mb-6">Business Profile</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[#A5B6C8] mb-2">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]"
            />
          </div>
          
          <div>
            <label className="block text-[#A5B6C8] mb-2">Business Email</label>
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]"
            />
          </div>

          <div>
            <label className="block text-[#A5B6C8] mb-2">Business Type</label>
            <select className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]">
              <option>Retail</option>
              <option>Food & Beverage</option>
              <option>Services</option>
              <option>E-commerce</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Terminal Settings */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
        <h3 className="text-[#E7ECEF] mb-6">Terminal Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[#A5B6C8] mb-2">Default Tip Percentage</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={defaultTip}
                onChange={(e) => setDefaultTip(e.target.value)}
                min="0"
                max="100"
                className="w-32 bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]"
              />
              <span className="text-[#A5B6C8]">%</span>
            </div>
            <p className="text-[#A5B6C8] mt-2">Applied to all transactions by default</p>
          </div>
          
          <div>
            <label className="block text-[#A5B6C8] mb-2">Tax Rate</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="w-32 bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF]"
              />
              <span className="text-[#A5B6C8]">%</span>
            </div>
            <p className="text-[#A5B6C8] mt-2">Local sales tax rate</p>
          </div>

          <div>
            <label className="block text-[#A5B6C8] mb-2">Receipt Settings</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#00E7FF]" />
                <span className="text-[#E7ECEF]">Auto-send digital receipts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#00E7FF]" />
                <span className="text-[#E7ECEF]">Include transaction hash in receipts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#00E7FF]" />
                <span className="text-[#E7ECEF]">Print physical receipts</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
        <h3 className="text-[#E7ECEF] mb-6">Wallet Addresses</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[#A5B6C8] mb-2">Solana Wallet Address</label>
            <input
              type="text"
              value={solanaAddress}
              onChange={(e) => setSolanaAddress(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF] font-mono"
            />
          </div>
          
          <div>
            <label className="block text-[#A5B6C8] mb-2">Base Wallet Address</label>
            <input
              type="text"
              value={baseAddress}
              onChange={(e) => setBaseAddress(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF] font-mono"
            />
          </div>

          <div>
            <label className="block text-[#A5B6C8] mb-2">Ethereum Wallet Address</label>
            <input
              type="text"
              value={ethereumAddress}
              onChange={(e) => setEthereumAddress(e.target.value)}
              className="w-full bg-[#0B0D0F] border border-[#1F2228] rounded-lg px-4 py-2 text-[#E7ECEF] focus:outline-none focus:border-[#00E7FF] font-mono"
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-[#121417] border border-[#1F2228] rounded-lg p-6">
        <h3 className="text-[#E7ECEF] mb-6">Security Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[#A5B6C8] mb-2">Two-Factor Authentication</label>
            <div className="flex items-center justify-between">
              <span className="text-[#E7ECEF]">Enabled</span>
              <button className="px-4 py-2 bg-[#1F2228] text-[#E7ECEF] rounded-lg hover:bg-[#2A2D35] transition-colors">
                Manage 2FA
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-[#A5B6C8] mb-2">API Access</label>
            <div className="flex items-center justify-between">
              <span className="text-[#E7ECEF]">3 active API keys</span>
              <button className="px-4 py-2 bg-[#1F2228] text-[#E7ECEF] rounded-lg hover:bg-[#2A2D35] transition-colors">
                Manage Keys
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-gradient-to-r from-[#00E7FF] to-[#3457FF] text-[#0B0D0F] rounded-lg hover:opacity-90 transition-opacity"
        >
          Save All Changes
        </button>
      </div>
    </div>
  );
}
