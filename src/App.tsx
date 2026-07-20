import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TouchCard } from './components/TouchCard';
import { WeatherData, ThemeMode } from './types';

export default function App() {
  // Application State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [theme] = useState<ThemeMode>('eye-comfort-dark');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [speakingSection, setSpeakingSection] = useState<'today' | 'tomorrow' | 'welcome' | null>(null);

  // References to keep track of speech synthesis objects
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch weather data from Express API
  const fetchWeather = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch("/api/weather");
      if (!res.ok) throw new Error("API responded with error");
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err) {
      console.error("Error fetching weather:", err);
      setIsError(true);
      // Fallback is handled server-side as well, but just in case, populate fallback state
      const mockFallback = getFallbackClientWeather();
      setWeather(mockFallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe client-side fallback generation if endpoint completely crashes
  const getFallbackClientWeather = (): WeatherData => {
    return {
      today: {
        type: 'sunny',
        tempMin: 26,
        tempMax: 33,
        description: '晴天',
        audioScript: '今天是晴天。最高温度有三十三度，最低二十六度。天气比较热，太阳很大。出门记得带把伞遮太阳，多喝温水，注意防暑。'
      },
      tomorrow: {
        type: 'cloudy',
        tempMin: 25,
        tempMax: 32,
        description: '多云转雷阵雨',
        audioScript: '明天是阴天，下午可能会下雷阵雨。最高温度有三十二度，最低二十五度。出门记得带上雨伞，走路要小心路滑，防雷防雨。'
      },
      lastUpdated: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + " (本地离线)"
    };
  };

  // Load weather and start 30-min WiFi check interval on mount
  useEffect(() => {
    fetchWeather();
    
    // Set class list for Tailwind high-contrast / dark theme support
    const root = window.document.documentElement;
    if (theme === 'eye-comfort-dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Wi-Fi connection check interval: every 30 minutes auto-refresh weather
    const wifiInterval = setInterval(() => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      // WiFi check: default to true if browser doesn't support network connection API
      const isWifi = conn ? (conn.type === 'wifi' || conn.type === 'ethernet' || conn.effectiveType === 'wifi') : true;
      
      if (isWifi) {
        console.log("Wi-Fi link detected. Automatically updating weather.");
        fetchWeather();
      }
    }, 1800000); // 30 minutes (1800000ms)

    // Cleanup speech and interval on unmount
    return () => {
      clearInterval(wifiInterval);
      stopAllSpeech();
    };
  }, []);

  // Update theme class lists on change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'eye-comfort-dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#09090b'; // zinc-950
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#ffffff';
    }
  }, [theme]);

  // Handle Speech Synthesis
  const speakText = (text: string, section: 'today' | 'tomorrow' | 'welcome') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error("Speech synthesis is not supported in this browser.");
      return;
    }

    // Stop current speech if any
    stopAllSpeech();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    
    // Warm and clear slower speech rate, highly legible: rate = 0.75
    utterance.rate = 0.75;
    utterance.pitch = 1.05; // Friendly/pleasant tone

    utterance.onstart = () => {
      setSpeakingSection(section);
    };

    utterance.onend = () => {
      setSpeakingSection(null);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setSpeakingSection(null);
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    setSpeakingSection(section);
    window.speechSynthesis.speak(utterance);
  };

  const stopAllSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingSection(null);
    currentUtteranceRef.current = null;
  };

  const handleCardTap = (section: 'today' | 'tomorrow') => {
    if (speakingSection === section) {
      // Toggle off if already speaking the current section
      stopAllSpeech();
    } else {
      // 1. Instantly trigger weather update in the background when clicked
      fetchWeather();

      // 2. Delay voice broadcast by exactly 150ms
      setTimeout(() => {
        const dayData = section === 'today' ? weather?.today : weather?.tomorrow;
        if (dayData && dayData.audioScript) {
          speakText(dayData.audioScript, section);
        }
      }, 150);
    }
  };

  // Base background theme classes
  const isDark = theme === 'eye-comfort-dark';
  const mainBgClass = isDark ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900';

  return (
    <div 
      id="app-container"
      className={`h-screen w-screen flex flex-col overflow-hidden ${mainBgClass}`}
    >
      {/* Top Header Controls */}
      <Header
        theme={theme}
        onRefresh={fetchWeather}
        isUpdating={isLoading}
        lastUpdated={weather?.lastUpdated || ''}
        isError={isError}
      />

      {/* Main Grid View - Split vertically 50/50, fits 100% of remaining screen height */}
      <main 
        id="weather-grid"
        className="flex-1 flex flex-col min-h-0 w-full overflow-hidden"
      >
        {/* UPPER HALF: TODAY CARD */}
        <TouchCard
          id="card-today"
          label="今天"
          dayData={weather ? weather.today : null}
          isSpeaking={speakingSection === 'today'}
          onTap={() => handleCardTap('today')}
          theme={theme}
        />

        {/* LOWER HALF: TOMORROW CARD */}
        <TouchCard
          id="card-tomorrow"
          label="明天"
          dayData={weather ? weather.tomorrow : null}
          isSpeaking={speakingSection === 'tomorrow'}
          onTap={() => handleCardTap('tomorrow')}
          theme={theme}
        />
      </main>

      {/* Bottom Floating Vocal Announcement Indicator */}
      {speakingSection && (
        <div 
          id="speaking-indicator-bar"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-sky-500 border-2 border-white text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 z-50 animate-bounce"
        >
          <div className="flex space-x-1">
            <span className="w-1.5 h-6 bg-white rounded-full animate-[soundbar_0.8s_infinite]" style={{ animationDelay: '0s' }} />
            <span className="w-1.5 h-4 bg-white rounded-full animate-[soundbar_0.8s_infinite]" style={{ animationDelay: '0.15s' }} />
            <span className="w-1.5 h-7 bg-white rounded-full animate-[soundbar_0.8s_infinite]" style={{ animationDelay: '0.3s' }} />
            <span className="w-1.5 h-5 bg-white rounded-full animate-[soundbar_0.8s_infinite]" style={{ animationDelay: '0.45s' }} />
          </div>
          <span className="text-lg font-black tracking-wider">
            {speakingSection === 'welcome' ? '播报欢迎语中...' : speakingSection === 'today' ? '播报今天天气中...' : '播报明天天气中...'}
          </span>
          <button 
            onClick={stopAllSpeech}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm font-black border border-white cursor-pointer"
          >
            停止
          </button>
        </div>
      )}

      {/* Helper Styling for speech wave animation */}
      <style>{`
        @keyframes soundbar {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.7); }
        }
      `}</style>
    </div>
  );
}
