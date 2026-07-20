import React from 'react';
import { WeatherDay, ThemeMode } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface TouchCardProps {
  id: string;
  label: "今天" | "明天";
  dayData: WeatherDay | null;
  isSpeaking: boolean;
  onTap: () => void;
  theme: ThemeMode;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  id,
  label,
  dayData,
  isSpeaking,
  onTap,
  theme
}) => {
  // Haptic feedback function
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60]); // 60ms vibration
    }
  };

  const handleCardClick = () => {
    triggerHaptic();
    onTap();
  };

  if (!dayData) {
    return (
      <div 
        id={id}
        className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse bg-zinc-900 border-4 border-zinc-800"
      >
        <span className="text-3xl font-black text-white">正在加载天气...</span>
      </div>
    );
  }

  // Determine Vibrant Palette styling dynamically based on weather type
  // "晴天使用暖色系，雨天使用冷色系。"
  // Warm color: sunny (Gold #FFD700)
  // Cool color: rainy, snowy, cloudy (Dodger Blue #1E90FF)
  const isWarm = dayData.type === 'sunny';
  
  const bgClass = isWarm 
    ? 'bg-[#FFD700] active:bg-[#E6C200] text-black border-b-[12px] border-black' 
    : 'bg-[#1E90FF] active:bg-[#1873CC] text-white border-b-[12px] border-black/20';

  const labelBadgeClass = isWarm
    ? 'bg-black text-white'
    : 'bg-white text-black';

  return (
    <button
      id={id}
      onClick={handleCardClick}
      className={`relative w-full flex-1 flex flex-col items-center justify-center pt-14 pb-4 px-4 sm:px-12 transition-all duration-200 select-none cursor-pointer outline-none focus:ring-8 focus:ring-sky-500
        ${bgClass}
        ${isSpeaking ? 'ring-8 ring-sky-400 scale-[0.99] z-10 shadow-2xl' : ''}
      `}
      aria-label={`${label}天气，最高气温${dayData.tempMax}度，最低${dayData.tempMin}度，天气为${dayData.description}。点按可播报天气。`}
    >
      {/* Speaking Glow Animation Wave */}
      {isSpeaking && (
        <div className="absolute inset-0 bg-sky-500/10 animate-pulse pointer-events-none rounded-sm">
          {/* Animated sound ripples */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-4 border-sky-400/30 rounded-full animate-ping pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border-2 border-sky-400/10 rounded-full animate-ping pointer-events-none" style={{ animationDelay: '0.3s' }} />
        </div>
      )}

      {/* TOP LEFT FIXED INFO BADGE */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-10 flex items-center gap-3 pointer-events-none">
        <div className={`px-5 py-1.5 sm:px-8 sm:py-2.5 rounded-full text-xl sm:text-4xl font-black uppercase tracking-tighter shadow-2xl ${labelBadgeClass}`}>
          {label}
        </div>

        {isSpeaking && (
          <span className={`flex items-center font-black text-sm sm:text-xl animate-bounce ${isWarm ? 'text-black' : 'text-white'}`}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> 播报中...
          </span>
        )}
      </div>

      {/* CENTER ROW CONTENT LAYOUT */}
      <div className="flex flex-row items-center justify-center gap-4 sm:gap-16 w-full max-w-6xl pointer-events-none">
        
        {/* Left side: Massive weather representation */}
        <div className="w-1/2 flex justify-center">
          <WeatherIcon 
            type={dayData.type} 
            className="w-36 h-36 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 drop-shadow-[0_12px_12px_rgba(0,0,0,0.35)]" 
          />
        </div>

        {/* Right side: Gigantic temperature numbers and textual descriptions */}
        <div className="w-1/2 flex flex-col items-center justify-center text-center">
          <span className="text-[90px] sm:text-[140px] md:text-[180px] font-[900] leading-none tracking-tighter drop-shadow-lg">
            {dayData.tempMax}°
          </span>
          <span className="text-2xl sm:text-4xl md:text-5xl font-black opacity-85 mt-[-5px] sm:mt-[-15px] tracking-wide">
            {dayData.description}
          </span>
          <span className="text-lg sm:text-2xl font-black opacity-60 mt-1 sm:mt-2">
            最低 {dayData.tempMin}°C
          </span>
        </div>

      </div>
    </button>
  );
};
