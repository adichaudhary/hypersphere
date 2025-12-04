import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  usdValue: number;
  status: 'completed' | 'pending' | 'failed';
  walletAddress: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  isDark?: boolean;
}

export function TransactionsTable({ transactions, isDark }: TransactionsTableProps) {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      completed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      failed: 'bg-red-50 text-red-700 border-red-200'
    };

    const darkStyles = {
      completed: 'bg-green-900/30 text-green-400 border-green-800',
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      failed: 'bg-red-900/30 text-red-400 border-red-800'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm ${isDark ? darkStyles[status] : styles[status]}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b transition-colors duration-300 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <th className={`text-left py-3 px-4 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>Transaction ID</th>
            <th className={`text-left py-3 px-4 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>Date & Time</th>
            <th className={`text-left py-3 px-4 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>Wallet Address</th>
            <th className={`text-right py-3 px-4 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>Amount (SOL)</th>
            <th className={`text-right py-3 px-4 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>Amount (USDC)</th>
            <th className={`text-right py-3 px-4 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>USD Value</th>
            <th className={`text-center py-3 px-4 transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr 
              key={transaction.id}
              className={`border-b transition-colors ${
                index === 0 
                  ? isDark ? 'bg-indigo-900/20' : 'bg-indigo-50/30'
                  : ''
              } ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800/50' 
                  : 'border-slate-100 hover:bg-slate-50'
              }`}
            >
              <td className="py-4 px-4">
                <code className={`text-sm px-2 py-1 rounded transition-colors duration-300 ${
                  isDark 
                    ? 'text-slate-300 bg-slate-800' 
                    : 'text-slate-600 bg-slate-100'
                }`}>
                  {transaction.id}
                </code>
              </td>
              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className={`transition-colors duration-300 ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}>{formatTime(transaction.timestamp)}</span>
                  <span className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>{formatDate(transaction.timestamp)}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <code className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {transaction.walletAddress}
                </code>
              </td>
              <td className="py-4 px-4 text-right">
                <span className={`transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}>{transaction.amount.toFixed(2)} USDC</span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className={`transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}>${transaction.usdValue.toFixed(2)}</span>
              </td>
              <td className="py-4 px-4 text-center">
                {getStatusBadge(transaction.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <p className={`transition-colors duration-300 ${
            isDark ? 'text-slate-500' : 'text-slate-500'
          }`}>No transactions yet. Waiting for payments...</p>
        </div>
      )}
    </div>
  );
}