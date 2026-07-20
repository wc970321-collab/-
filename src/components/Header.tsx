import React from 'react';
import { ThemeMode } from '../types';
import { MapPin, RefreshCw, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  theme: ThemeMode;
  onRefresh: () => void;
  isUpdating: boolean;
  lastUpdated: string;
  isError: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onRefresh,
  isUpdating,
  lastUpdated,
  isError
}) => {
  const isDark = theme === 'eye-comfort-dark';

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30]);
    }
  };

  const handleRefresh = () => {
    triggerHaptic();
    onRefresh();
  };

  return (
    <header 
      id="app-header"
      className={`w-full py-2.5 px-4 flex flex-row items-center justify-between border-b-2 select-none shrink-0
        ${isDark ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
    >
      {/* Left side: Position */}
      <div className="flex items-center space-x-2">
        <div className={`p-1.5 rounded-full ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-red-50 text-red-600'}`}>
          <MapPin className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">广州花都</span>
          <span className="text-[10px] font-mono opacity-40 mt-0.5">
            {isError ? '离线预报' : `更新: ${lastUpdated.split(' ')[1] || ''}`}
          </span>
        </div>
      </div>

      {/* Right side: Update Weather Button */}
      <div className="flex items-center space-x-2">
        {isError && (
          <div className="hidden sm:flex items-center text-red-500 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span>获取失败</span>
          </div>
        )}
        <button
          onClick={handleRefresh}
          disabled={isUpdating}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl border text-sm font-black transition-all cursor-pointer outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50
            ${isDark 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800' 
              : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'}`}
          aria-label="刷新天气数据"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? '更新中' : '更新天气'}</span>
        </button>
      </div>
    </header>
  );
};
