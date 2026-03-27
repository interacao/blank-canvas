import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { NewsSourceConfig } from "@/hooks/useNewsConfig";

const DEFAULT_SOURCES: NewsSourceConfig[] = [
  { id: "g1", name: "G1", rssUrl: "https://g1.globo.com/rss/g1/", enabled: true, count: 3 },
  { id: "cnn", name: "CNN Brasil", rssUrl: "https://www.cnnbrasil.com.br/feed/", enabled: false, count: 3 },
  { id: "uol", name: "UOL", rssUrl: "https://rss.uol.com.br/feed/noticias.xml", enabled: false, count: 3 },
];

const ConfigNoticias = () => {
  const [sources, setSources] = useState<NewsSourceConfig[]>(DEFAULT_SOURCES);
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [frequency, setFrequency] = useState(1);
  const [mediasPerNews, setMediasPerNews] = useState(2);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["news_sources", "news_frequency", "news_medias_per"]);

    if (data) {
      data.forEach((r: any) => {
        if (r.key === "news_sources") {
          try { setSources(JSON.parse(r.value)); } catch { /* keep default */ }
        }
        if (r.key === "news_frequency") setFrequency(parseInt(r.value) || 1);
        if (r.key === "news_medias_per") setMediasPerNews(parseInt(r.value) || 2);
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

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateCount = (id: string, count: number) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, count: Math.max(1, Math.min(10, count)) } : s))
    );
  };

  const addCustomSource = () => {
    if (!customUrl.trim() || !customName.trim()) return;
    const id = `custom-${Date.now()}`;
    setSources((prev) => [...prev, { id, name: customName.trim(), rssUrl: customUrl.trim(), enabled: true, count: 3 }]);
    setCustomUrl("");
    setCustomName("");
  };

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        upsertSetting("news_sources", JSON.stringify(sources)),
        upsertSetting("news_frequency", String(frequency)),
        upsertSetting("news_medias_per", String(mediasPerNews)),
      ]);
      toast({ title: "✅ Configurações de notícias salvas!" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isCustom = (id: string) => id.startsWith("custom-");

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-bold text-foreground mb-1">📰 Fontes de Notícias</h2>
      <p className="text-muted-foreground text-xs mb-4">
        Selecione as fontes e quantas notícias de cada uma aparecerão no carrossel.
      </p>

      {/* Sources list */}
      <div className="flex flex-col gap-2 mb-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`rounded-xl border p-3 flex items-center gap-3 transition-opacity ${
              source.enabled ? "bg-secondary border-border" : "bg-background border-border opacity-50"
            }`}
          >
            {/* Toggle */}
            <button
              onClick={() => toggleSource(source.id)}
              className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                source.enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${
                  source.enabled ? "left-5" : "left-1"
                }`}
              />
            </button>

            {/* Name */}
            <span className="text-foreground font-medium text-sm flex-1 min-w-0 truncate">
              {source.name}
            </span>

            {/* Count */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => updateCount(source.id, source.count - 1)}
                className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold active:scale-90"
              >
                −
              </button>
              <span className="w-6 text-center text-foreground text-sm font-bold">{source.count}</span>
              <button
                onClick={() => updateCount(source.id, source.count + 1)}
                className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold active:scale-90"
              >
                +
              </button>
            </div>

            {/* Remove custom */}
            {isCustom(source.id) && (
              <button
                onClick={() => removeSource(source.id)}
                className="w-7 h-7 rounded-md bg-destructive/20 text-destructive flex items-center justify-center text-xs active:scale-90"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add custom source */}
      <div className="rounded-xl border border-dashed border-border p-3 mb-4">
        <p className="text-xs text-muted-foreground mb-2">Adicionar fonte personalizada (RSS)</p>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Nome da fonte"
            className="w-full h-9 rounded-lg bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
          />
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="URL do feed RSS"
              className="flex-1 h-9 rounded-lg bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
            />
            <button
              onClick={addCustomSource}
              disabled={!customUrl.trim() || !customName.trim()}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
            >
              + Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Frequency config */}
      <hr className="border-border my-4" />
      <h3 className="text-sm font-bold text-foreground mb-2">⚖️ Balanceamento do Carrossel</h3>
      <p className="text-muted-foreground text-xs mb-3">
        Defina a proporção entre notícias e promoções/mídias na apresentação.
      </p>

      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">
          A cada <span className="text-foreground font-bold">{mediasPerNews}</span> promoção(ões)/mídia(s), exibir notícia(s)
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={mediasPerNews}
          onChange={(e) => setMediasPerNews(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1 (mais notícias)</span>
          <span>5 (menos notícias)</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-1 block">
          Notícias por bloco: <span className="text-foreground font-bold">{frequency}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={frequency}
          onChange={(e) => setFrequency(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1</span>
          <span>5</span>
        </div>
      </div>

      {/* Preview summary */}
      <div className="rounded-xl bg-card border border-border p-3 mb-4">
        <p className="text-xs text-muted-foreground">
          📋 Resultado: a cada <strong className="text-foreground">{mediasPerNews}</strong> promoção(ões)/mídia(s), 
          serão exibidas <strong className="text-foreground">{frequency}</strong> notícia(s)
        </p>
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

export default ConfigNoticias;
