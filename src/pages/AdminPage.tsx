import { useState } from "react";
import NovaPromocao from "@/components/admin/NovaPromocao";
import AdicionarMidia from "@/components/admin/AdicionarMidia";
import GerenciarCarrossel from "@/components/admin/GerenciarCarrossel";
import Configuracoes from "@/components/admin/Configuracoes";
import ConfigRelogio from "@/components/admin/ConfigRelogio";
import ConfigNoticias from "@/components/admin/ConfigNoticias";
import ConfigClima from "@/components/admin/ConfigClima";
import { useNavigate } from "react-router-dom";

type Tab = "promo" | "media" | "gerenciar" | "relogio" | "clima" | "noticias" | "config";

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: "promo", label: "Promoção", emoji: "📸" },
  { id: "media", label: "Mídia", emoji: "🎬" },
  { id: "gerenciar", label: "Gerenciar", emoji: "📋" },
  { id: "relogio", label: "Relógio", emoji: "🕐" },
  { id: "clima", label: "Clima", emoji: "🌤️" },
  { id: "noticias", label: "Notícias", emoji: "📰" },
  { id: "config", label: "Config", emoji: "⚙️" },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("gerenciar");
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4 gap-2">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors"
        >
          ← Voltar ao Início
        </button>
        <h2 className="text-lg font-bold text-foreground mb-4">📺 Painel Admin</h2>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card">
          <button onClick={() => navigate("/")} className="text-muted-foreground text-sm">← Início</button>
          <span className="text-foreground font-bold">📺 Admin</span>
          <div className="w-12" />
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {activeTab === "promo" && <NovaPromocao />}
          {activeTab === "media" && <AdicionarMidia />}
          {activeTab === "gerenciar" && <GerenciarCarrossel />}
          {activeTab === "relogio" && (
            <div className="p-4 md:p-6 pb-28">
              <h1 className="text-xl font-bold text-foreground mb-4">🕐 Personalizar Relógio</h1>
              <ConfigRelogio />
            </div>
          )}
          {activeTab === "clima" && (
            <div className="p-4 md:p-6 pb-28">
              <h1 className="text-xl font-bold text-foreground mb-4">🌤️ Previsão do Tempo</h1>
              <ConfigClima />
            </div>
          )}
          {activeTab === "noticias" && (
            <div className="p-4 md:p-6 pb-28">
              <h1 className="text-xl font-bold text-foreground mb-4">📰 Configurar Notícias</h1>
              <ConfigNoticias />
            </div>
          )}
          {activeTab === "config" && <Configuracoes />}
        </div>

        {/* Bottom Navigation - mobile (scrollable) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[60px] flex flex-col items-center justify-center py-3 gap-1 transition-colors active:scale-95 ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground"
              }`}
              style={{ minHeight: "56px" }}
            >
              <span className="text-lg">{tab.emoji}</span>
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminPage;
