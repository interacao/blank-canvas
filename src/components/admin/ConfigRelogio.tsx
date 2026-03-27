import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ConfigRelogio = () => {
  const [clockText, setClockText] = useState("Minha Loja");
  const [clockSize, setClockSize] = useState(100);
  const [clockUppercase, setClockUppercase] = useState(true);
  const [clockBgUrl, setClockBgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["clock_text", "clock_size", "clock_bg_url", "clock_uppercase"]);

    if (data) {
      data.forEach((r: any) => {
        if (r.key === "clock_text") setClockText(r.value ?? "Minha Loja");
        if (r.key === "clock_size") setClockSize(parseInt(r.value) || 100);
        if (r.key === "clock_bg_url") setClockBgUrl(r.value || null);
        if (r.key === "clock_uppercase") setClockUppercase(r.value !== "false");
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

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const ext = f.name.split(".").pop() || "jpg";
      const path = `clock-bg/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("display-media")
        .upload(path, f, { contentType: f.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("display-media")
        .getPublicUrl(path);

      const url = urlData.publicUrl;
      await upsertSetting("clock_bg_url", url);
      setClockBgUrl(url);
      toast({ title: "✅ Fundo atualizado!" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBg = async () => {
    setLoading(true);
    try {
      await upsertSetting("clock_bg_url", "");
      setClockBgUrl(null);
      toast({ title: "🗑️ Fundo removido, usando padrão" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        upsertSetting("clock_text", clockText),
        upsertSetting("clock_size", String(clockSize)),
        upsertSetting("clock_uppercase", String(clockUppercase)),
      ]);
      toast({ title: "✅ Configurações do relógio salvas!" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Preview scale for the mini clock
  const previewScale = clockSize / 100;

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-bold text-foreground mb-1">🕐 Tela de Horas</h2>
      <p className="text-muted-foreground text-xs mb-3">
        Personalize o texto, tamanho do relógio e imagem de fundo.
      </p>

      {/* Preview */}
      <div
        className="w-full aspect-[2/1] rounded-xl border border-border mb-3 relative overflow-hidden flex flex-col items-center justify-center"
        style={{
          background: clockBgUrl
            ? `url(${clockBgUrl}) center/cover no-repeat`
            : "var(--tv-clock-gradient)",
        }}
      >
        {clockBgUrl && <div className="absolute inset-0 bg-black/30" />}
        <div
          className="font-clock font-black text-foreground leading-none tracking-wider relative z-10"
          style={{ fontSize: `${Math.max(1.5, 4 * previewScale)}rem` }}
        >
          12<span className="opacity-80">:</span>00
        </div>
        <p
          className="text-muted-foreground font-light tracking-wide relative z-10 mt-1"
          style={{ fontSize: `${Math.max(0.5, 0.75 * previewScale)}rem` }}
        >
          Segunda-feira, 10 de março de 2026
        </p>
        {clockText && (
          <p
            className={`text-primary font-semibold tracking-widest relative z-10 mt-1 ${clockUppercase ? "uppercase" : ""}`}
            style={{ fontSize: `${Math.max(0.5, 0.7 * previewScale)}rem` }}
          >
            {clockText}
          </p>
        )}
      </div>

      {/* Background image */}
      <label className="text-xs text-muted-foreground mb-2 block">Imagem de fundo</label>
      {!clockBgUrl ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-20 rounded-xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-foreground active:scale-95 transition-transform disabled:opacity-50 mb-3"
        >
          <span className="text-xl">🖼️</span>
          <span className="text-xs font-medium">{uploading ? "Enviando..." : "Enviar imagem (opcional)"}</span>
          <span className="text-xs text-muted-foreground">Padrão: gradiente escuro</span>
        </button>
      ) : (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex-1 h-10 rounded-lg bg-secondary text-foreground text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "🔄 Trocar"}
          </button>
          <button
            onClick={handleRemoveBg}
            disabled={loading}
            className="h-10 px-3 rounded-lg bg-destructive/20 text-destructive text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            🗑️ Usar padrão
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadBg}
        className="hidden"
      />

      {/* Text */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">Texto abaixo do relógio</label>
        <input
          type="text"
          value={clockText}
          onChange={(e) => setClockText(e.target.value)}
          placeholder="Nome da loja"
          className="w-full h-10 rounded-lg bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
        />
      </div>

      {/* Uppercase toggle */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => setClockUppercase(!clockUppercase)}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            clockUppercase ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${
              clockUppercase ? "left-5" : "left-1"
            }`}
          />
        </button>
        <label className="text-xs text-muted-foreground">Texto em MAIÚSCULAS</label>
      </div>

      {/* Size */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">
          Tamanho do relógio: <span className="text-foreground font-bold">{clockSize}%</span>
        </label>
        <input
          type="range"
          min={50}
          max={150}
          value={clockSize}
          onChange={(e) => setClockSize(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>50%</span>
          <span>150%</span>
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

export default ConfigRelogio;
