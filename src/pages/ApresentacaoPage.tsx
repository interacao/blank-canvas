import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CarrosselEngine from "@/components/CarrosselEngine";

const ApresentacaoPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-full h-full" style={{ cursor: "none" }}>
      <CarrosselEngine />
      <button
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          navigate("/");
        }}
        className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg text-xs font-medium bg-background/10 text-foreground/0 hover:text-foreground/80 hover:bg-background/60 backdrop-blur-sm transition-all duration-300 cursor-pointer"
      >
        ← Voltar
      </button>
    </div>
  );
};

export default ApresentacaoPage;
