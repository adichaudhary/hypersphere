import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  isDark?: boolean;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, subtitle, isDark }: StatsCardProps) {
  return (
    <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-300 ${
      isDark 
        ? 'bg-slate-900/95 border-slate-700/80' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`mb-2 transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>{title}</p>
          <p className={`mb-1 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>{value}</p>
          {subtitle && (
            <p className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}>{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg transition-colors duration-300 ${
          isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'
        }`}>
          <Icon className={`w-6 h-6 transition-colors duration-300 ${
            isDark ? 'text-indigo-400' : 'text-indigo-600'
          }`} />
        </div>
      </div>
      {trend && (
        <div className={`mt-4 pt-4 border-t transition-colors duration-300 ${
          isDark ? 'border-slate-700' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-1">
            <span className={`${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </span>
            <span className={`transition-colors duration-300 ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}>from last period</span>
          </div>
        </div>
      )}
    </div>
  );
}