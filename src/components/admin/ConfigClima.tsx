import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const mockEmojis = ["☀️", "⛅", "🌧️", "☁️", "🌦️"];
const mockTemps = [28, 26, 24, 27, 25];

const ConfigClima = () => {
  const [city, setCity] = useState("Limeira");
  const [state, setState] = useState("SP");
  const [duration, setDuration] = useState(12);
  const [enabled, setEnabled] = useState(true);
  const [forecastDays, setForecastDays] = useState(1);
  const [repeatCount, setRepeatCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["weather_city", "weather_state", "weather_duration", "weather_enabled", "weather_forecast_days", "weather_repeat"]);

    if (data) {
      data.forEach((r: any) => {
        if (r.key === "weather_city") setCity(r.value ?? "Limeira");
        if (r.key === "weather_state") setState(r.value ?? "SP");
        if (r.key === "weather_duration") setDuration(parseInt(r.value) || 12);
        if (r.key === "weather_enabled") setEnabled(r.value !== "false");
        if (r.key === "weather_forecast_days") setForecastDays(parseInt(r.value) || 1);
        if (r.key === "weather_repeat") setRepeatCount(parseInt(r.value) || 1);
      });
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const upsertSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (existing) {
      await supabase.from("app_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    } else {
      await supabase.from("app_settings").insert({ key, value });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        upsertSetting("weather_city", city),
        upsertSetting("weather_state", state),
        upsertSetting("weather_duration", String(duration)),
        upsertSetting("weather_enabled", String(enabled)),
        upsertSetting("weather_forecast_days", String(forecastDays)),
        upsertSetting("weather_repeat", String(repeatCount)),
      ]);
      toast({ title: "✅ Configurações do clima salvas!" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-bold text-foreground mb-1">🌤️ Previsão do Tempo</h2>
      <p className="text-muted-foreground text-xs mb-3">
        Configure a cidade e a duração do slide de clima no carrossel.
      </p>

      {/* Preview */}
      {forecastDays <= 1 ? (
        <div
          className="w-full aspect-[2/1] rounded-xl border border-border mb-3 relative overflow-hidden flex flex-col items-center justify-center"
          style={{ background: "var(--tv-weather-clear)" }}
        >
          <div className="text-5xl mb-1">☀️</div>
          <div className="font-clock font-black text-foreground leading-none text-4xl">28°</div>
          <p className="text-sm mt-1 capitalize opacity-90 font-light text-foreground">céu limpo</p>
          <div className="flex gap-6 mt-3 text-xs opacity-80 text-foreground">
            <div className="flex flex-col items-center">
              <span className="uppercase tracking-widest opacity-60 text-[8px]">Sensação</span>
              <span className="font-semibold">30°</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="uppercase tracking-widest opacity-60 text-[8px]">Umidade</span>
              <span className="font-semibold">55%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="uppercase tracking-widest opacity-60 text-[8px]">Mín / Máx</span>
              <span className="font-semibold">22° / 32°</span>
            </div>
          </div>
          <p className="mt-2 text-[10px] opacity-50 tracking-widest uppercase text-foreground">
            {city}, {state}
          </p>
        </div>
      ) : (
        <div className="w-full rounded-xl border border-border mb-3 overflow-hidden p-3" style={{ background: "var(--tv-weather-clear)" }}>
          <p className="text-[10px] text-foreground opacity-50 tracking-widest uppercase text-center mb-2">{city}, {state}</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(forecastDays, 5)}, 1fr)` }}>
            {Array.from({ length: forecastDays }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              return (
                <div key={i} className="flex flex-col items-center bg-foreground/10 rounded-lg py-2 px-1 gap-1">
                  <span className="text-[9px] font-semibold text-foreground uppercase tracking-wider">
                    {i === 0 ? "Hoje" : diasSemana[d.getDay()]}
                  </span>
                  <span className="text-2xl">{mockEmojis[i % mockEmojis.length]}</span>
                  <span className="font-clock font-black text-foreground text-lg leading-none">{mockTemps[i % mockTemps.length]}°</span>
                  <span className="text-[8px] text-foreground opacity-60">{mockTemps[i % mockTemps.length] - 4}° / {mockTemps[i % mockTemps.length] + 3}°</span>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] text-foreground opacity-40 text-center mt-2">Cada dia será exibido como um slide separado no carrossel</p>
        </div>
      )}

      {/* Enabled toggle */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => setEnabled(!enabled)}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${
              enabled ? "left-5" : "left-1"
            }`}
          />
        </button>
        <label className="text-xs text-muted-foreground">Exibir slide de clima no carrossel</label>
      </div>

      {/* City */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex: Limeira"
          className="w-full h-10 rounded-lg bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
        />
      </div>

      {/* State */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">Estado (sigla)</label>
        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
          placeholder="Ex: SP"
          maxLength={2}
          className="w-full h-10 rounded-lg bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
        />
      </div>

      {/* Forecast Days */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">
          Dias de previsão: <span className="text-foreground font-bold">{forecastDays} {forecastDays === 1 ? "dia (hoje)" : "dias"}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={forecastDays}
          onChange={(e) => setForecastDays(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1 (hoje)</span>
          <span>5 dias</span>
        </div>
      </div>

      {/* Repeat count */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">
          Vezes por ciclo: <span className="text-foreground font-bold">{repeatCount}x</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={repeatCount}
          onChange={(e) => setRepeatCount(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1x</span>
          <span>5x</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Quantas vezes o bloco de clima aparece em cada ciclo completo do carrossel</p>
      </div>

      {/* Duration */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">
          Duração de cada slide: <span className="text-foreground font-bold">{duration}s</span>
        </label>
        <input
          type="range"
          min={5}
          max={30}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>5s</span>
          <span>30s</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold active:scale-95 transition-transform disabled:opacity-50"
      >
        {loading ? "Salvando..." : "💾 Salvar"}
      </button>
    </div>
  );
};

export default ConfigClima;
