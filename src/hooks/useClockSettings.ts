import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClockSettings {
  clockText: string;
  clockSize: number;
  clockBgUrl: string | null;
  clockUppercase: boolean;
}

export function useClockSettings() {
  const [settings, setSettings] = useState<ClockSettings>({
    clockText: "Minha Loja",
    clockSize: 100,
    clockBgUrl: null,
    clockUppercase: true,
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["clock_text", "clock_size", "clock_bg_url", "clock_uppercase"]);

      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setSettings({
          clockText: map["clock_text"] ?? "Minha Loja",
          clockSize: map["clock_size"] ? parseInt(map["clock_size"]) : 100,
          clockBgUrl: map["clock_bg_url"] || null,
          clockUppercase: map["clock_uppercase"] !== "false",
        });
      }
    };

    fetch();

    const channel = supabase
      .channel("app_settings_clock")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return settings;
}
