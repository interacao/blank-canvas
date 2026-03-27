interface SlideNoticiaProps {
  title: string;
  description: string;
  duration: number;
  source?: string;
  imageUrl?: string | null;
}

const sourceColors: Record<string, string> = {
  G1: "bg-destructive text-destructive-foreground",
  "CNN BRASIL": "bg-red-700 text-white",
  UOL: "bg-yellow-500 text-black",
};

const SlideNoticia = ({ title, description, duration, source = "G1", imageUrl }: SlideNoticiaProps) => {
  const colorClass = sourceColors[source.toUpperCase()] || "bg-primary text-primary-foreground";

  return (
    <div
      className="tv-slide-from-right flex w-full h-full"
      style={{ background: "var(--tv-news-bg)" }}
    >
      {/* Content side */}
      <div className={`flex flex-col justify-between ${imageUrl ? "w-[60%]" : "w-full"} p-16`}>
        {/* Source badge */}
        <div className="flex items-center gap-3">
          <div className={`${colorClass} font-black text-4xl px-4 py-1 rounded-lg`}>
            {source.toLowerCase()}
          </div>
          <span className="text-muted-foreground text-lg uppercase tracking-widest">Notícias</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center max-w-[95%]">
          <h1
            className="text-foreground font-bold leading-tight line-clamp-3"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            {title}
          </h1>
          <p className="mt-6 text-muted-foreground text-xl md:text-2xl leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <div
            className="h-full rounded-full tv-progress-bar"
            style={{
              background: `hsl(var(--tv-progress))`,
              animationDuration: `${duration}s`,
            }}
          />
        </div>
      </div>

      {/* Image side */}
      {imageUrl && (
        <div className="w-[40%] h-full relative">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--tv-news-bg)] to-transparent w-16" />
        </div>
      )}
    </div>
  );
};

export default SlideNoticia;
