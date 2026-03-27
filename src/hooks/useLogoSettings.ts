import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LogoSettings {
  logoUrl: string | null;
  logoSize: number;
  logoPosition: string;
}

export function useLogoSettings() {
  const [settings, setSettings] = useState<LogoSettings>({
    logoUrl: null,
    logoSize: 15,
    logoPosition: "bottom-right",
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["logo_url", "logo_size", "logo_position"]);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setSettings({
          logoUrl: map["logo_url"] || null,
          logoSize: map["logo_size"] ? parseInt(map["logo_size"]) : 15,
          logoPosition: map["logo_position"] || "bottom-right",
        });
      }
    };

    fetch();

    const channel = supabase
      .channel("app_settings_logo")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return settings;
}
