import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PromoItem {
  id: string;
  media_url: string | null;
  overlay_text: string | null;
  preco_de: number | null;
  preco_por: number | null;
  duracao_segundos: number | null;
  ativo: boolean | null;
}

const NovaPromocao = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [precoDe, setPrecoDe] = useState("");
  const [precoPor, setPrecoPor] = useState("");
  const [duracao, setDuracao] = useState("10");
  const [loading, setLoading] = useState(false);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchPromos = useCallback(async () => {
    const { data } = await supabase
      .from("display_items")
      .select("*")
      .eq("type", "promo")
      .order("ordem", { ascending: true });
    if (data) setPromos(data);
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const formatPrice = (val: string) =>
    val ? parseFloat(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setOverlayText("");
    setPrecoDe("");
    setPrecoPor("");
    setDuracao("10");
    setEditingId(null);
  };

  const startEdit = (item: PromoItem) => {
    setEditingId(item.id);
    setPreview(item.media_url);
    setOverlayText(item.overlay_text || "");
    setPrecoDe(item.preco_de != null ? String(item.preco_de) : "");
    setPrecoPor(item.preco_por != null ? String(item.preco_por) : "");
    setDuracao(item.duracao_segundos != null ? String(item.duracao_segundos) : "10");
    setFile(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("display_items").delete().eq("id", id);
    if (error) {
      toast({ title: "❌ Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🗑️ Removido", description: "Promoção excluída." });
      fetchPromos();
    }
    setDeleteId(null);
  };

  const handlePublish = useCallback(async () => {
    if (!file && !editingId) return;
    setLoading(true);
    try {
      let mediaUrl = preview;

      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `promo/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("display-media")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("display-media")
          .getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
      }

      const payload = {
        overlay_text: overlayText || null,
        preco_de: precoDe ? parseFloat(precoDe) : null,
        preco_por: precoPor ? parseFloat(precoPor) : null,
        duracao_segundos: parseInt(duracao) || 10,
        ...(mediaUrl ? { media_url: mediaUrl } : {}),
      };

      if (editingId) {
        const { error } = await supabase
          .from("display_items")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "✅ Atualizado!", description: "Promoção editada com sucesso." });
      } else {
        const { error } = await supabase.from("display_items").insert({
          type: "promo",
          ativo: true,
          ...payload,
          media_url: mediaUrl,
        });
        if (error) throw error;
        toast({ title: "✅ Publicado na TV!", description: "A promoção já está no carrossel." });
      }

      resetForm();
      fetchPromos();
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [file, overlayText, precoDe, precoPor, duracao, editingId, preview, fetchPromos]);

  return (
    <div className="flex flex-col p-4 md:p-6 gap-6 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-24">
      <h1 className="text-2xl font-bold text-foreground">
        {editingId ? "✏️ Editar Promoção" : "📸 Nova Promoção"}
      </h1>

      {/* Upload / Preview area */}
      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full max-w-lg h-36 rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-foreground active:scale-95 transition-transform"
        >
          <span className="text-4xl">📸</span>
          <span className="font-semibold">Abrir Câmera / Galeria</span>
        </button>
      ) : (
        <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-background border border-border">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-64 object-contain bg-black/50"
          />
          {(overlayText || precoDe || precoPor) && (
            <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "var(--tv-overlay)" }}>
              {overlayText && (
                <p className="text-foreground font-bold text-sm leading-tight">{overlayText}</p>
              )}
              <div className="flex items-baseline gap-2 mt-1">
                {precoDe && (
                  <span className="line-through text-xs" style={{ color: "hsl(var(--tv-price-old))" }}>
                    {formatPrice(precoDe)}
                  </span>
                )}
                {precoPor && (
                  <span className="font-black text-lg" style={{ color: "hsl(var(--tv-price-new))" }}>
                    {formatPrice(precoPor)}
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Change image button */}
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute top-2 right-2 bg-background/80 text-foreground text-xs px-3 py-1.5 rounded-lg hover:bg-background transition-colors"
          >
            Trocar imagem
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {/* Form fields - always visible when there's a preview */}
      {preview && (
        <div className="flex flex-col gap-4 max-w-lg">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Texto do overlay</label>
            <textarea
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Ex: Oferta imperdível!"
              className="w-full min-h-[60px] rounded-xl bg-secondary text-foreground p-3 border border-border focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Preço DE</label>
              <input
                type="number"
                value={precoDe}
                onChange={(e) => setPrecoDe(e.target.value)}
                placeholder="9.99"
                step="0.01"
                className="w-full h-12 rounded-xl bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Preço POR</label>
              <input
                type="number"
                value={precoPor}
                onChange={(e) => setPrecoPor(e.target.value)}
                placeholder="4.99"
                step="0.01"
                className="w-full h-12 rounded-xl bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Duração (segundos)</label>
            <input
              type="number"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className="w-full h-12 rounded-xl bg-secondary text-foreground px-3 border border-border focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={resetForm}
              className="flex-1 h-14 rounded-xl bg-secondary text-foreground font-semibold active:scale-95 transition-transform"
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? "Enviando..." : editingId ? "💾 Salvar" : "📺 Publicar na TV"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de promoções existentes */}
      {promos.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-bold text-foreground mb-3">Promoções cadastradas ({promos.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-3 flex gap-3 transition-opacity ${
                  item.ativo ? "bg-secondary border-border" : "bg-background border-border opacity-50"
                }`}
              >
                {item.media_url && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-background">
                    <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-sm truncate">
                    {item.overlay_text || "Promoção"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {item.duracao_segundos}s • {item.ativo ? "Ativo" : "Inativo"}
                  </p>
                  {item.preco_por != null && (
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--tv-price-new))" }}>
                      {item.preco_por.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-destructive/20 text-destructive font-medium hover:bg-destructive/30 transition-colors"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-6">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-foreground font-bold text-lg mb-2">Excluir promoção?</h3>
            <p className="text-muted-foreground text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-semibold active:scale-95 transition-transform"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 h-12 rounded-xl bg-destructive text-destructive-foreground font-bold active:scale-95 transition-transform"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaPromocao;
