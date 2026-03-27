import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const POSITIONS = [
  { id: "top-left", label: "↖" },
  { id: "top-center", label: "↑" },
  { id: "top-right", label: "↗" },
  { id: "center-left", label: "←" },
  { id: "center", label: "●" },
  { id: "center-right", label: "→" },
  { id: "bottom-left", label: "↙" },
  { id: "bottom-center", label: "↓" },
  { id: "bottom-right", label: "↘" },
];

const positionToStyle = (pos: string): React.CSSProperties => {
  const map: Record<string, React.CSSProperties> = {
    "top-left": { top: 12, left: 12 },
    "top-center": { top: 12, left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: 12, right: 12 },
    "center-left": { top: "50%", left: 12, transform: "translateY(-50%)" },
    "center": { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    "center-right": { top: "50%", right: 12, transform: "translateY(-50%)" },
    "bottom-left": { bottom: 12, left: 12 },
    "bottom-center": { bottom: 12, left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: 12, right: 12 },
  };
  return map[pos] || map["bottom-right"];
};

const Configuracoes = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(15);
  const [logoPosition, setLogoPosition] = useState("bottom-right");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["logo_url", "logo_size", "logo_position"]);

    if (data) {
      data.forEach((r: any) => {
        if (r.key === "logo_url") setLogoUrl(r.value || null);
        if (r.key === "logo_size") setLogoSize(parseInt(r.value) || 15);
        if (r.key === "logo_position") setLogoPosition(r.value || "bottom-right");
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

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const ext = f.name.split(".").pop() || "png";
      const path = `logos/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("display-media")
        .upload(path, f, { contentType: f.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("display-media")
        .getPublicUrl(path);

      const url = urlData.publicUrl;
      await upsertSetting("logo_url", url);
      setLogoUrl(url);
      toast({ title: "✅ Logo atualizado!" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        upsertSetting("logo_size", String(logoSize)),
        upsertSetting("logo_position", logoPosition),
      ]);
      toast({ title: "✅ Configurações salvas!" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLoading(true);
    try {
      await upsertSetting("logo_url", "");
      setLogoUrl(null);
      toast({ title: "🗑️ Logo removido" });
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-4 md:p-6 gap-4 pb-28">
      <h1 className="text-xl font-bold text-foreground">⚙️ Configurações</h1>

      <div className="max-w-lg">
        <h2 className="text-base font-bold text-foreground mb-1">Logo da Empresa</h2>
        <p className="text-muted-foreground text-xs mb-3">
          O logo será exibido em overlay em todas as promoções e mídias.
        </p>

        {/* Preview - compact */}
        <div className="w-full aspect-[2/1] rounded-xl bg-card border border-border mb-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-background flex items-center justify-center">
            <span className="text-muted-foreground text-xs">Preview</span>
          </div>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className="absolute object-contain pointer-events-none"
              style={{
                width: `${logoSize}%`,
                maxHeight: `${logoSize}%`,
                ...positionToStyle(logoPosition),
              }}
            />
          )}
        </div>

        {/* Upload */}
        {!logoUrl ? (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 rounded-xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-foreground active:scale-95 transition-transform disabled:opacity-50"
          >
            <span className="text-2xl">🖼️</span>
            <span className="font-semibold text-sm">{uploading ? "Enviando..." : "Selecionar Logo"}</span>
            <span className="text-xs text-muted-foreground">PNG ou JPG transparente recomendado</span>
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
              onClick={handleRemoveLogo}
              disabled={loading}
              className="h-10 px-3 rounded-lg bg-destructive/20 text-destructive text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
            >
              🗑️ Remover
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleUploadLogo}
          className="hidden"
        />

        {logoUrl && (
          <>
            {/* Position + Size side by side on desktop */}
            <div className="flex flex-col md:flex-row gap-4 mt-3">
              {/* Position picker */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Posição</label>
                <div className="inline-grid grid-cols-3 gap-1 bg-secondary rounded-lg p-1.5 border border-border">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => setLogoPosition(pos.id)}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                        logoPosition === pos.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size slider */}
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-2 block">
                  Tamanho: <span className="text-foreground font-bold">{logoSize}%</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={logoSize}
                  onChange={(e) => setLogoSize(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? "Salvando..." : "💾 Salvar Configurações"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Configuracoes;

export { positionToStyle };
