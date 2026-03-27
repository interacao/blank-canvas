import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">📺 TV Display</h1>
          <p className="text-muted-foreground">Gerencie o conteúdo da sua TV de loja</p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => navigate("/apresentacao")}
            className="w-full h-20 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
          >
            <span className="text-2xl">🖥️</span>
            Ir para Apresentação
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="w-full h-20 rounded-2xl bg-secondary text-secondary-foreground font-bold text-lg flex items-center justify-center gap-3 hover:bg-muted active:scale-[0.98] transition-all border border-border"
          >
            <span className="text-2xl">⚙️</span>
            Ir para Tela de Administração
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
