import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WeatherSettings {
  weatherCity: string;
  weatherState: string;
  weatherDuration: number;
  weatherEnabled: boolean;
  weatherForecastDays: number;
  weatherRepeat: number;
}

export function useWeatherSettings() {
  const [settings, setSettings] = useState<WeatherSettings>({
    weatherCity: "Limeira",
    weatherState: "SP",
    weatherDuration: 12,
    weatherEnabled: true,
    weatherForecastDays: 1,
    weatherRepeat: 1,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["weather_city", "weather_state", "weather_duration", "weather_enabled", "weather_forecast_days", "weather_repeat"]);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setSettings({
          weatherCity: map["weather_city"] ?? "Limeira",
          weatherState: map["weather_state"] ?? "SP",
          weatherDuration: map["weather_duration"] ? parseInt(map["weather_duration"]) : 12,
          weatherEnabled: map["weather_enabled"] !== "false",
          weatherForecastDays: map["weather_forecast_days"] ? parseInt(map["weather_forecast_days"]) : 1,
          weatherRepeat: map["weather_repeat"] ? parseInt(map["weather_repeat"]) : 1,
        });
      }
    };

    fetchData();

    const channel = supabase
      .channel("app_settings_weather")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return settings;
}
