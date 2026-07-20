import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("No GEMINI_API_KEY env variable found. Using fallback mock weather.");
}

// Helper to map Open-Meteo weather codes
function mapWeatherCode(code: number): { type: 'sunny' | 'cloudy' | 'rainy' | 'snowy'; description: string } {
  if ([0].includes(code)) {
    return { type: 'sunny', description: '晴天' };
  } else if ([1, 2, 3, 45, 48].includes(code)) {
    return { type: 'cloudy', description: '多云' };
  } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    let desc = '雨天';
    if ([51, 53, 55].includes(code)) desc = '毛毛雨';
    else if ([61, 80].includes(code)) desc = '小雨';
    else if ([63, 81].includes(code)) desc = '中雨';
    else if ([65, 82].includes(code)) desc = '大雨';
    else if ([95, 96, 99].includes(code)) desc = '雷阵雨';
    return { type: 'rainy', description: desc };
  } else {
    return { type: 'snowy', description: '雨雪天' };
  }
}

// Convert numbers to Chinese text for friendly TTS
function numberToChinese(num: number): string {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  let result = '';
  if (absNum === 0) {
    result = '零';
  } else if (absNum < 10) {
    const units = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    result = units[absNum];
  } else if (absNum < 20) {
    const units = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    result = '十' + (absNum % 10 === 0 ? '' : units[absNum % 10]);
  } else if (absNum < 100) {
    const units = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const tens = Math.floor(absNum / 10);
    const ones = absNum % 10;
    result = units[tens] + '十' + (ones === 0 ? '' : units[ones]);
  } else {
    result = num.toString();
  }
  return (isNegative ? '零下' : '') + result;
}

// Generate caring voice script using local template
function generateFallbackScript(dayName: '今天' | '明天', type: string, min: number, max: number, desc: string): string {
  const minStr = numberToChinese(min);
  const maxStr = numberToChinese(max);
  
  if (type === 'sunny') {
    return `${dayName}是晴天。最高温度有${maxStr}度，最低${minStr}度。天气比较热，太阳很大。出门记得带一把伞遮太阳，多喝一点温水，注意防暑。`;
  } else if (type === 'cloudy') {
    return `${dayName}是多云天气。最高温度有${maxStr}度，最低${minStr}度。天气不冷不热，比较舒服。出门散步挺好的，记得多走动走动。`;
  } else if (type === 'rainy') {
    return `${dayName}有雨，天气是${desc}。最高温度有${maxStr}度，最低${minStr}度。外面正在下雨，地面湿滑。出门一定要带好雨伞，走路要小心慢行，防雷防雨。`;
  } else {
    return `${dayName}可能有雨雪。最高温度有${maxStr}度，最低${minStr}度。天气特别冷，出门一定要穿暖和，多穿一件厚外套，注意防滑和保暖。`;
  }
}

// Get seasonal mock data in case Open-Meteo fails completely
function getSeasonalMockWeather(): any {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  
  let todayType: 'sunny' | 'cloudy' | 'rainy' | 'snowy' = 'sunny';
  let todayMin = 26;
  let todayMax = 33;
  let todayDesc = "晴天";

  let tomorrowType: 'sunny' | 'cloudy' | 'rainy' | 'snowy' = 'cloudy';
  let tomorrowMin = 25;
  let tomorrowMax = 31;
  let tomorrowDesc = "多云";

  if (currentMonth >= 11 || currentMonth <= 2) { // Winter
    todayType = 'cloudy'; todayMin = 10; todayMax = 18; todayDesc = "阴天";
    tomorrowType = 'rainy'; tomorrowMin = 8; tomorrowMax = 14; tomorrowDesc = "小雨";
  } else if (currentMonth >= 4 && currentMonth <= 9) { // Summer / Rainy Season
    todayType = 'rainy'; todayMin = 25; todayMax = 30; todayDesc = "大雨";
    tomorrowType = 'rainy'; tomorrowMin = 24; tomorrowMax = 29; tomorrowDesc = "雷阵雨";
  }

  return {
    today: { type: todayType, tempMin: todayMin, tempMax: todayMax, description: todayDesc },
    tomorrow: { type: tomorrowType, tempMin: tomorrowMin, tempMax: tomorrowMax, description: tomorrowDesc }
  };
}

// Fetch live weather data from Open-Meteo API
async function fetchLiveWeather(): Promise<any> {
  try {
    // Guangzhou Huadu coordinates: lat=23.4020, lon=113.2242
    const url = "https://api.open-meteo.com/v1/forecast?latitude=23.4020&longitude=113.2242&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai";
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo API response status: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.daily) {
      const todayMax = Math.round(data.daily.temperature_2m_max[0]);
      const todayMin = Math.round(data.daily.temperature_2m_min[0]);
      const todayCode = data.daily.weather_code[0];

      const tomorrowMax = Math.round(data.daily.temperature_2m_max[1]);
      const tomorrowMin = Math.round(data.daily.temperature_2m_min[1]);
      const tomorrowCode = data.daily.weather_code[1];

      const todayMapped = mapWeatherCode(todayCode);
      const tomorrowMapped = mapWeatherCode(tomorrowCode);

      return {
        today: {
          type: todayMapped.type,
          tempMin: todayMin,
          tempMax: todayMax,
          description: todayMapped.description,
        },
        tomorrow: {
          type: tomorrowMapped.type,
          tempMin: tomorrowMin,
          tempMax: tomorrowMax,
          description: tomorrowMapped.description,
        }
      };
    }
  } catch (err) {
    console.error("Error fetching live weather from Open-Meteo, using seasonal mock:", err);
  }
  return getSeasonalMockWeather();
}

// Weather API endpoint
app.get("/api/weather", async (req, res) => {
  // 1. Fetch live accurate weather data for Guangzhou Huadu (fallback to seasonal mock if offline/failed)
  const baseWeather = await fetchLiveWeather();
  const formatTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

  // 2. If Gemini is not available, generate scripts with local high-quality templates directly
  if (!ai) {
    console.log("Using template weather (API key missing or client not initialized)");
    return res.json({
      today: {
        ...baseWeather.today,
        audioScript: generateFallbackScript('今天', baseWeather.today.type, baseWeather.today.tempMin, baseWeather.today.tempMax, baseWeather.today.description)
      },
      tomorrow: {
        ...baseWeather.tomorrow,
        audioScript: generateFallbackScript('明天', baseWeather.tomorrow.type, baseWeather.tomorrow.tempMin, baseWeather.tomorrow.tempMax, baseWeather.tomorrow.description)
      },
      lastUpdated: formatTime
    });
  }

  // 3. If Gemini is available, use it to narrate the accurate Open-Meteo data with natural, warm scripts
  try {
    const prompt = `Translate the following real-time weather data for Guangzhou Huadu (广州市花都区) into extremely caring, slow, warm, and friendly Chinese voice weather scripts for both today and tomorrow.
Return a structured JSON with the exact same format.

Weather Data:
Today: Weather type is '${baseWeather.today.type}', temperature range is ${baseWeather.today.tempMin} to ${baseWeather.today.tempMax} degrees Celsius, description is '${baseWeather.today.description}'.
Tomorrow: Weather type is '${baseWeather.tomorrow.type}', temperature range is ${baseWeather.tomorrow.tempMin} to ${baseWeather.tomorrow.tempMax} degrees Celsius, description is '${baseWeather.tomorrow.description}'.

Rules for "audioScript":
1. It must be spoken clearly, simply, and slowly in warm, caring natural language.
2. You must spell out ALL numbers as Chinese characters (e.g., "二十八度", not "28度"; "三十度", not "30度") so text-to-speech engines read them perfectly.
3. Include helpful instructions tailored to the weather (e.g., watch out for wet slippery roads if raining, wear warm jackets if cold, bring a sun-shield umbrella and stay hydrated if sunny, etc.).
4. Strictly do NOT include words like "老人家" (elderly), "长辈" or any age-specific labels to maintain a broad, inclusive and respectful tone.
5. Do NOT include other keys. Keep "today" and "tomorrow" in the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            today: {
              type: Type.OBJECT,
              properties: {
                audioScript: { type: Type.STRING, description: "Chinese text-to-speech script. Spell out numbers as words (e.g. 三十二度)." }
              },
              required: ["audioScript"]
            },
            tomorrow: {
              type: Type.OBJECT,
              properties: {
                audioScript: { type: Type.STRING, description: "Chinese text-to-speech script. Spell out numbers as words (e.g. 二十五度)." }
              },
              required: ["audioScript"]
            }
          },
          required: ["today", "tomorrow"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText.trim());
      return res.json({
        today: {
          ...baseWeather.today,
          audioScript: parsed.today.audioScript
        },
        tomorrow: {
          ...baseWeather.tomorrow,
          audioScript: parsed.tomorrow.audioScript
        },
        lastUpdated: formatTime
      });
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error) {
    console.error("Error generating weather audio scripts with Gemini, returning fallback template scripts:", error);
    return res.json({
      today: {
        ...baseWeather.today,
        audioScript: generateFallbackScript('今天', baseWeather.today.type, baseWeather.today.tempMin, baseWeather.today.tempMax, baseWeather.today.description)
      },
      tomorrow: {
        ...baseWeather.tomorrow,
        audioScript: generateFallbackScript('明天', baseWeather.tomorrow.type, baseWeather.tomorrow.tempMin, baseWeather.tomorrow.tempMax, baseWeather.tomorrow.description)
      },
      lastUpdated: formatTime
    });
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static files server mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
