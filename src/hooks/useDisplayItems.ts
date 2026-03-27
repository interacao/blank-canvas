import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DisplayItem {
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

export function useDisplayItems(type: "media" | "promo") {
  const [items, setItems] = useState<DisplayItem[]>([]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("display_items")
      .select("*")
      .eq("type", type)
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (data) setItems(data);
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel(`display_items_${type}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "display_items" }, () => {
        fetchItems();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [type]);

  return items;
}
