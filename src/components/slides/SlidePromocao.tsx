interface SlidePromocaoProps {
  mediaUrl: string;
  overlayText?: string;
  precoDe?: number | null;
  precoPor?: number | null;
}

const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SlidePromocao = ({ mediaUrl, overlayText, precoDe, precoPor }: SlidePromocaoProps) => {
  return (
    <div className="tv-slide-enter relative w-full h-full bg-background">
      <img
        src={mediaUrl}
        alt=""
        className="w-full h-full object-cover"
      />

      {/* Overlay */}
      {(overlayText || precoDe || precoPor) && (
        <div
          className="absolute bottom-0 left-0 right-0 px-16 py-10 flex items-end justify-between"
          style={{ background: "var(--tv-overlay)" }}
        >
          <div className="flex-1">
            {overlayText && (
              <p className="text-foreground font-bold leading-tight"
                 style={{ fontSize: "clamp(1.5rem, 3vw, 3rem)" }}>
                {overlayText}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end ml-8">
            {precoDe != null && (
              <span
                className="line-through text-2xl md:text-3xl font-semibold"
                style={{ color: "hsl(var(--tv-price-old))" }}
              >
                {formatPrice(precoDe)}
              </span>
            )}
            {precoPor != null && (
              <span
                className="font-black"
                style={{
                  color: "hsl(var(--tv-price-new))",
                  fontSize: "clamp(2rem, 5vw, 5rem)",
                }}
              >
                {formatPrice(precoPor)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidePromocao;
