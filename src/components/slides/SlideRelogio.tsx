import { useState, useEffect } from "react";
import { useClockSettings } from "@/hooks/useClockSettings";

const diasSemana = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado"
];

const meses = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

const SlideRelogio = () => {
  const [now, setNow] = useState(new Date());
  const { clockText, clockSize, clockBgUrl, clockUppercase } = useClockSettings();

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const horas = String(now.getHours()).padStart(2, "0");
  const minutos = String(now.getMinutes()).padStart(2, "0");
  const segundos = String(now.getSeconds()).padStart(2, "0");
  const dataFormatada = `${diasSemana[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;

  const scale = clockSize / 100;

  return (
    <div
      className="tv-slide-enter flex flex-col items-center justify-center w-full h-full relative"
      style={{
        background: clockBgUrl
          ? `url(${clockBgUrl}) center/cover no-repeat`
          : "var(--tv-clock-gradient)",
      }}
    >
      {clockBgUrl && <div className="absolute inset-0 bg-black/40" />}

      <div
        className="font-clock font-black text-foreground leading-none tracking-wider relative z-10"
        style={{ fontSize: `clamp(4rem, ${15 * scale}vw, ${18 * scale}rem)` }}
      >
        {horas}
        <span className="opacity-80">:</span>
        {minutos}
        <span className="opacity-50">:</span>
        <span className="opacity-70">{segundos}</span>
      </div>

      <p
        className="mt-6 text-muted-foreground font-light tracking-wide relative z-10"
        style={{ fontSize: `clamp(1rem, ${3 * scale}vw, ${2.5 * scale}rem)` }}
      >
        {dataFormatada}
      </p>

      {clockText && (
        <p
          className={`mt-4 text-primary font-semibold tracking-widest relative z-10 ${clockUppercase ? "uppercase" : ""}`}
          style={{ fontSize: `clamp(0.875rem, ${2.5 * scale}vw, ${2 * scale}rem)` }}
        >
          {clockText}
        </p>
      )}
    </div>
  );
};

export default SlideRelogio;
