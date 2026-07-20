import React from 'react';
import { WeatherType } from '../types';

interface WeatherIconProps {
  type: WeatherType;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ type, className = "w-40 h-40" }) => {
  switch (type) {
    case 'sunny':
      return (
        <div className={`relative flex items-center justify-center ${className}`} id="weather-icon-sunny">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-amber-500 animate-[spin_25s_linear_infinite]"
            fill="currentColor"
          >
            {/* Sun Core */}
            <circle cx="50" cy="50" r="22" className="drop-shadow-lg" />
            {/* Sun Beams */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              return (
                <rect
                  key={i}
                  x="47"
                  y="10"
                  width="6"
                  height="12"
                  rx="3"
                  transform={`rotate(${angle} 50 50)`}
                  className="origin-center"
                />
              );
            })}
          </svg>
        </div>
      );

    case 'cloudy':
      return (
        <div className={`relative flex items-center justify-center ${className}`} id="weather-icon-cloudy">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
          >
            {/* Back Cloud */}
            <path
              d="M32 68h36a18 18 0 005.4-35.2 24 24 0 00-45.8-2 18 18 0 00-11 19.2A18 18 0 0032 68z"
              className="fill-neutral-400 opacity-70 animate-[pulse_3s_ease-in-out_infinite]"
            />
            {/* Front Cloud */}
            <path
              d="M40 76h32a14 14 0 004.2-27.4 18 18 0 00-34.4-1.5 14 14 0 00-8.5 14.9A14 14 0 0040 76z"
              className="fill-neutral-300 dark:fill-neutral-200 drop-shadow-md transform translate-x-1 translate-y-1 animate-[bounce_5s_ease-in-out_infinite]"
            />
          </svg>
        </div>
      );

    case 'rainy':
      return (
        <div className={`relative flex items-center justify-center ${className}`} id="weather-icon-rainy">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
          >
            {/* Rain Cloud */}
            <path
              d="M36 58h28a14 14 0 004.2-27.4 18 18 0 00-34.4-1.5 14 14 0 00-8.5 14.9A14 14 0 0036 58z"
              className="fill-neutral-500 dark:fill-neutral-400 drop-shadow-lg"
            />
            {/* Animated Raindrops */}
            <g className="stroke-sky-400 dark:stroke-sky-300 stroke-[3.5] stroke-linecap-round">
              {/* Rain line 1 */}
              <line x1="32" y1="65" x2="28" y2="77" className="animate-[rain-fall_1.2s_linear_infinite]" style={{ animationDelay: '0s' }} />
              {/* Rain line 2 */}
              <line x1="42" y1="67" x2="38" y2="79" className="animate-[rain-fall_1.2s_linear_infinite]" style={{ animationDelay: '0.4s' }} />
              {/* Rain line 3 */}
              <line x1="52" y1="65" x2="48" y2="77" className="animate-[rain-fall_1.2s_linear_infinite]" style={{ animationDelay: '0.2s' }} />
              {/* Rain line 4 */}
              <line x1="62" y1="67" x2="58" y2="79" className="animate-[rain-fall_1.2s_linear_infinite]" style={{ animationDelay: '0.6s' }} />
            </g>
          </svg>
          <style>{`
            @keyframes rain-fall {
              0% { transform: translateY(-5px); opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translateY(15px); opacity: 0; }
            }
          `}</style>
        </div>
      );

    case 'snowy':
      return (
        <div className={`relative flex items-center justify-center ${className}`} id="weather-icon-snowy">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
          >
            {/* Snow Cloud */}
            <path
              d="M36 58h28a14 14 0 004.2-27.4 18 18 0 00-34.4-1.5 14 14 0 00-8.5 14.9A14 14 0 0036 58z"
              className="fill-sky-100 dark:fill-sky-200 opacity-90 drop-shadow-md"
            />
            {/* Snow Flakes */}
            <g className="fill-white dark:fill-sky-100">
              {/* Flake 1 */}
              <circle cx="33" cy="68" r="3" className="animate-[snow-drift_2s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
              {/* Flake 2 */}
              <circle cx="43" cy="71" r="2.5" className="animate-[snow-drift_2s_ease-in-out_infinite]" style={{ animationDelay: '0.7s' }} />
              {/* Flake 3 */}
              <circle cx="53" cy="68" r="3.2" className="animate-[snow-drift_2s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
              {/* Flake 4 */}
              <circle cx="63" cy="71" r="2.5" className="animate-[snow-drift_2s_ease-in-out_infinite]" style={{ animationDelay: '1.1s' }} />
            </g>
          </svg>
          <style>{`
            @keyframes snow-drift {
              0% { transform: translate(0, -5px); opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translate(6px, 18px); opacity: 0; }
            }
          `}</style>
        </div>
      );

    default:
      return null;
  }
};
