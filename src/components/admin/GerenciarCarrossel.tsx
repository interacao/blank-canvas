import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DisplayItem {
  id: string;
  type: string;
  media_url: string | null;
  overlay_text: string | null;
  preco_de: number | null;
  preco_por: number | null;
  duracao_segundos: number | null;
  ativo: boolean | null;
  ordem: number | null;
}

const GerenciarCarrossel = () => {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("display_items")
      .select("*")
      .order("ordem", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleAtivo = async (item: DisplayItem) => {
    const { error } = await supabase
      .from("display_items")
      .update({ ativo: !item.ativo })
      .eq("id", item.id);

    if (error) {
      toast({ title: "❌ Erro", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("display_items").delete().eq("id", id);
    if (error) {
      toast({ title: "❌ Erro", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "🗑️ Removido", description: "Item excluído do carrossel." });
    }
    setDeleteId(null);
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

    // Update ordem
    const updates = newItems.map((item, i) => ({ id: item.id, ordem: i }));
    for (const u of updates) {
      await supabase.from("display_items").update({ ordem: u.ordem }).eq("id", u.id);
    }
    setItems(newItems);
  };

  const promos = items.filter((i) => i.type === "promo");
  const medias = items.filter((i) => i.type === "media");

  const renderSection = (title: string, emoji: string, sectionItems: DisplayItem[]) => (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        <span>{emoji}</span> {title}
        <span className="text-sm font-normal text-muted-foreground">({sectionItems.length})</span>
      </h2>

      {sectionItems.length === 0 && (
        <p className="text-muted-foreground text-sm py-4 text-center">Nenhum item</p>
      )}

      <div className="flex flex-col gap-3">
        {sectionItems.map((item) => {
          const globalIndex = items.indexOf(item);
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3 flex gap-3 transition-opacity ${
                item.ativo ? "bg-secondary border-border" : "bg-background border-border opacity-50"
              }`}
            >
              {/* Thumbnail */}
              {item.media_url && (
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-background">
                  {/\.(mp4|webm)/i.test(item.media_url) ? (
                    <video src={item.media_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm truncate">
                  {item.overlay_text || (item.type === "media" ? "Mídia" : "Promoção")}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {item.duracao_segundos}s • {item.ativo ? "Ativo" : "Inativo"}
                </p>
                {item.preco_por != null && (
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--tv-price-new))" }}>
                    {item.preco_por.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => moveItem(globalIndex, -1)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground active:scale-90 transition-transform"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(globalIndex, 1)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground active:scale-90 transition-transform"
                >
                  ▼
                </button>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => toggleAtivo(item)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform ${
                    item.ativo ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.ativo ? "👁" : "⊘"}
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center active:scale-90 transition-transform"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 p-4 overflow-y-auto pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-4">Gerenciar Carrossel</h1>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <>
          {renderSection("Promoções", "🏷️", promos)}
          {renderSection("Mídias", "🎬", medias)}
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-6">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-foreground font-bold text-lg mb-2">Excluir item?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Esta ação não pode ser desfeita.
            </p>
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

export default GerenciarCarrossel;
