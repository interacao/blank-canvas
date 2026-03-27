import { useState, useEffect } from "react";
import { useNewsConfig, NewsSourceConfig } from "./useNewsConfig";

export interface Noticia {
  title: string;
  description: string;
  source: string;
  imageUrl: string | null;
}

export function useNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const config = useNewsConfig();

  useEffect(() => {
    const enabledSources = config.sources.filter((s) => s.enabled);
    if (enabledSources.length === 0) {
      setNoticias([]);
      return;
    }

    const fetchSource = async (source: NewsSourceConfig): Promise<Noticia[]> => {
      try {
        const rssEncoded = encodeURIComponent(source.rssUrl);
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssEncoded}`);
        if (!res.ok) return [];
        const data = await res.json();
        if (data.status !== "ok" || !data.items) return [];
        return data.items.slice(0, source.count).map((item: any) => {
          // Try multiple image sources
          let imageUrl = item.enclosure?.link || item.thumbnail || null;
          // If no image, try to extract from content HTML
          if (!imageUrl && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) imageUrl = imgMatch[1];
          }
          if (!imageUrl && item.description) {
            const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) imageUrl = imgMatch[1];
          }
          return {
            title: item.title || "",
            description: (item.description || "").replace(/<[^>]*>/g, "").slice(0, 200),
            source: source.name,
            imageUrl,
          };
        });
      } catch {
        return [];
      }
    };

    const fetchAll = async () => {
      // Fetch sources sequentially to avoid rss2json rate limits
      const results: Noticia[] = [];
      for (const source of enabledSources) {
        const items = await fetchSource(source);
        results.push(...items);
        // Small delay between sources to avoid rate limiting
        if (enabledSources.indexOf(source) < enabledSources.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      setNoticias(results);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.sources]);

  return noticias;
}
