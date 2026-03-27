import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewsSourceConfig {
  id: string;
  name: string;
  rssUrl: string;
  enabled: boolean;
  count: number;
}

export interface NewsConfig {
  sources: NewsSourceConfig[];
  frequency: number; // show N news per batch of promos/media
  mediasPerNews: number; // show 1 news every N promos/media
}

const DEFAULT_SOURCES: NewsSourceConfig[] = [
  { id: "g1", name: "G1", rssUrl: "https://g1.globo.com/rss/g1/", enabled: true, count: 3 },
  { id: "r7", name: "CNN Brasil", rssUrl: "https://www.cnnbrasil.com.br/feed/", enabled: false, count: 3 },
  { id: "uol", name: "UOL", rssUrl: "https://rss.uol.com.br/feed/noticias.xml", enabled: false, count: 3 },
];

export function useNewsConfig() {
  const [config, setConfig] = useState<NewsConfig>({
    sources: DEFAULT_SOURCES,
    frequency: 1,
    mediasPerNews: 2,
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["news_sources", "news_frequency", "news_medias_per"]);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });

        let sources = DEFAULT_SOURCES;
        if (map["news_sources"]) {
          try {
            sources = JSON.parse(map["news_sources"]);
          } catch { /* keep default */ }
        }

        setConfig({
          sources,
          frequency: map["news_frequency"] ? parseInt(map["news_frequency"]) : 1,
          mediasPerNews: map["news_medias_per"] ? parseInt(map["news_medias_per"]) : 2,
        });
      }
    };

    fetch();

    const channel = supabase
      .channel("app_settings_news")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return config;
}
