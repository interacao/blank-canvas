import { useEffect } from "react";
import CarrosselEngine from "@/components/CarrosselEngine";

const Index = () => {
  useEffect(() => {
    // Auto fullscreen
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  return <CarrosselEngine />;
};

export default Index;
