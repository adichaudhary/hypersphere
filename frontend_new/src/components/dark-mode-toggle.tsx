import { Moon, Sun } from 'lucide-react';

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex items-center h-11 w-20 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      style={{
        backgroundColor: isDark ? '#4f46e5' : '#cbd5e1'
      }}
      aria-label="Toggle dark mode"
    >
      <span
        className="inline-block h-9 w-9 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out"
        style={{
          transform: isDark ? 'translateX(2.25rem)' : 'translateX(0.25rem)'
        }}
      >
        <span className="flex items-center justify-center h-full w-full">
          {isDark ? (
            <Moon className="w-5 h-5 text-indigo-600" />
          ) : (
            <Sun className="w-5 h-5 text-slate-600" />
          )}
        </span>
      </span>
    </button>
  );
}
