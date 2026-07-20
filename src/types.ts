export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface WeatherDay {
  type: WeatherType;
  tempMin: number;
  tempMax: number;
  description: string;
  audioScript: string;
}

export interface WeatherData {
  today: WeatherDay;
  tomorrow: WeatherDay;
  lastUpdated: string;
}

export type ThemeMode = 'high-contrast-light' | 'eye-comfort-dark';
export type VoiceSpeed = 'slow' | 'normal';
