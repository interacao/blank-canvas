import { useState, useEffect, useCallback } from "react";

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
  main: string;
  dayLabel: string;
}

const weatherEmoji: Record<string, string> = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Mist: "🌫️",
  Fog: "🌫️",
  Haze: "🌫️",
};

const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const getGradient = (main: string) => {
  if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) return "var(--tv-weather-rain)";
  if (["Clouds", "Mist", "Fog", "Haze"].includes(main)) return "var(--tv-weather-cloudy)";
  return "var(--tv-weather-clear)";
};

interface SlideClimaProps {
  onError?: () => void;
  city?: string;
  state?: string;
  forecastDays?: number;
}

const SlideClima = ({ onError, city = "Limeira", state = "SP", forecastDays = 1 }: SlideClimaProps) => {
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);

  const fetchWeather = useCallback(async () => {
    try {
      const key = import.meta.env.VITE_OPENWEATHER_KEY;
      if (!key) {
        const mockDays: WeatherData[] = Array.from({ length: Math.max(forecastDays, 1) }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          return {
            temp: 28 - i,
            feels_like: 30 - i,
            humidity: 55 + i * 3,
            temp_min: 22 - i,
            temp_max: 32 - i,
            description: ["céu limpo", "parcialmente nublado", "chuva leve", "nublado", "garoa"][i % 5],
            icon: "01d",
            main: ["Clear", "Clouds", "Rain", "Clouds", "Drizzle"][i % 5],
            dayLabel: i === 0 ? "Hoje" : diasSemana[d.getDay()],
          };
        });
        setWeatherList(mockDays);
        return;
      }

      if (forecastDays <= 1) {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},BR&lang=pt_br&units=metric&appid=${key}`
        );
        if (!res.ok) { onError?.(); return; }
        const data = await res.json();
        setWeatherList([{
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          main: data.weather[0].main,
          dayLabel: "Hoje",
        }]);
      } else {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},BR&lang=pt_br&units=metric&appid=${key}`
        );
        if (!res.ok) { onError?.(); return; }
        const data = await res.json();

        const dayMap: Record<string, any[]> = {};
        for (const item of data.list) {
          const date = item.dt_txt.split(" ")[0];
          if (!dayMap[date]) dayMap[date] = [];
          dayMap[date].push(item);
        }

        const days = Object.keys(dayMap).slice(0, forecastDays);
        const result: WeatherData[] = days.map((date, i) => {
          const items = dayMap[date];
          const midday = items.find((it: any) => it.dt_txt.includes("12:00:00")) || items[0];
          const temps = items.map((it: any) => it.main.temp);
          const d = new Date(date + "T12:00:00");
          return {
            temp: Math.round(midday.main.temp),
            feels_like: Math.round(midday.main.feels_like),
            humidity: midday.main.humidity,
            temp_min: Math.round(Math.min(...temps)),
            temp_max: Math.round(Math.max(...temps)),
            description: midday.weather[0].description,
            icon: midday.weather[0].icon,
            main: midday.weather[0].main,
            dayLabel: i === 0 ? "Hoje" : diasSemana[d.getDay()],
          };
        });
        setWeatherList(result);
      }
    } catch {
      onError?.();
    }
  }, [onError, city, forecastDays]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (weatherList.length === 0) return <div className="w-full h-full bg-background" />;

  const today = weatherList[0];

  // Single day: full-screen layout
  if (weatherList.length === 1) {
    return (
      <div
        className="tv-slide-enter flex flex-col items-center justify-center w-full h-full text-foreground"
        style={{ background: getGradient(today.main) }}
      >
        <div className="text-8xl md:text-9xl mb-4">
          {weatherEmoji[today.main] || "🌡️"}
        </div>
        <div className="font-clock font-black leading-none" style={{ fontSize: "clamp(5rem, 12vw, 14rem)" }}>
          {today.temp}°
        </div>
        <p className="text-3xl md:text-4xl mt-2 capitalize opacity-90 font-light">
          {today.description}
        </p>
        <div className="flex gap-12 mt-10 text-xl md:text-2xl opacity-80">
          <div className="flex flex-col items-center">
            <span className="text-sm uppercase tracking-widest opacity-60">Sensação</span>
            <span className="font-semibold text-3xl">{today.feels_like}°</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm uppercase tracking-widest opacity-60">Umidade</span>
            <span className="font-semibold text-3xl">{today.humidity}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm uppercase tracking-widest opacity-60">Mín / Máx</span>
            <span className="font-semibold text-3xl">{today.temp_min}° / {today.temp_max}°</span>
          </div>
        </div>
        <p className="mt-8 text-lg opacity-50 tracking-widest uppercase">{city}, {state}</p>
      </div>
    );
  }

  // Multiple days: today highlighted + forecast grid
  return (
    <div
      className="tv-slide-enter flex flex-col items-center justify-center w-full h-full text-foreground px-8 py-6"
      style={{ background: getGradient(today.main) }}
    >
      {/* Today - prominent */}
      <div className="flex items-center gap-6 mb-6">
        <div className="text-7xl md:text-8xl">{weatherEmoji[today.main] || "🌡️"}</div>
        <div className="flex flex-col">
          <span className="text-lg uppercase tracking-widest opacity-60 font-semibold">Hoje</span>
          <div className="font-clock font-black leading-none" style={{ fontSize: "clamp(4rem, 10vw, 10rem)" }}>
            {today.temp}°
          </div>
          <p className="text-2xl md:text-3xl capitalize opacity-90 font-light mt-1">{today.description}</p>
          <div className="flex gap-8 mt-3 text-base opacity-80">
            <span>Sensação {today.feels_like}°</span>
            <span>Umidade {today.humidity}%</span>
            <span>{today.temp_min}° / {today.temp_max}°</span>
          </div>
        </div>
      </div>

      {/* Forecast days grid */}
      <div
        className="grid gap-4 w-full max-w-5xl"
        style={{ gridTemplateColumns: `repeat(${weatherList.length - 1}, 1fr)` }}
      >
        {weatherList.slice(1).map((w, i) => (
          <div
            key={i}
            className="flex flex-col items-center bg-foreground/10 backdrop-blur-sm rounded-2xl py-5 px-3 gap-2"
          >
            <span className="text-base font-semibold uppercase tracking-wider opacity-80">
              {w.dayLabel}
            </span>
            <span className="text-5xl">{weatherEmoji[w.main] || "🌡️"}</span>
            <span className="font-clock font-black text-4xl leading-none">{w.temp}°</span>
            <span className="text-sm capitalize opacity-80">{w.description}</span>
            <span className="text-xs opacity-60">{w.temp_min}° / {w.temp_max}°</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-lg opacity-50 tracking-widest uppercase">{city}, {state}</p>
    </div>
  );
};

export default SlideClima;
