"use client";
import { useEffect, useState } from "react";

interface WeatherProps {
  lat?: number;
  lon?: number;
  label?: string;
}

export default function WeatherWidget({ lat, lon, label = "Departure" }: WeatherProps) {
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lon) return;
    async function fetchWeather() {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          setWeatherCode(data.current_weather.weathercode);
          setTemperature(data.current_weather.temperature);
        }
      } catch (e) {
        console.error("Failed to fetch weather", e);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [lat, lon]);

  if (!lat || !lon || loading) return null;

  // Open-Meteo WMO weather codes: 
  // 0: Clear
  // 1,2,3: Cloudy
  // 45,48: Fog
  // 51-67: Rain/Drizzle
  // 71-77: Snow
  // 80-82: Rain showers
  // 95-99: Thunderstorm

  let icon = "☀️";
  let alert = false;
  let text = "Clear skies";

  if (weatherCode !== null) {
    if ([1, 2, 3].includes(weatherCode)) { icon = "☁️"; text = "Cloudy"; }
    else if ([45, 48].includes(weatherCode)) { icon = "🌫️"; text = "Foggy"; }
    else if (weatherCode >= 51 && weatherCode <= 67) { icon = "🌧️"; text = "Rain expected"; alert = true; }
    else if (weatherCode >= 71 && weatherCode <= 77) { icon = "❄️"; text = "Snow expected"; alert = true; }
    else if (weatherCode >= 80 && weatherCode <= 82) { icon = "🌦️"; text = "Rain showers"; alert = true; }
    else if (weatherCode >= 95 && weatherCode <= 99) { icon = "⛈️"; text = "Thunderstorm Warning"; alert = true; }
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${alert ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-100"}`}>
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className={`text-xs font-bold uppercase ${alert ? "text-red-800" : "text-blue-800"}`}>
          {label} Weather {alert && "⚠️"}
        </p>
        <p className={`text-sm ${alert ? "text-red-700 font-medium" : "text-blue-700"}`}>
          {text} ({temperature}°C)
        </p>
      </div>
    </div>
  );
}
