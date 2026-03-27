import { useState, useEffect, useCallback, useRef } from "react";
import SlideRelogio from "./slides/SlideRelogio";
import SlideClima from "./slides/SlideClima";
import SlideNoticia from "./slides/SlideNoticia";
import SlideMidia from "./slides/SlideMidia";
import SlidePromocao from "./slides/SlidePromocao";
import { useDisplayItems } from "@/hooks/useDisplayItems";
import { positionToStyle } from "@/components/admin/Configuracoes";
import { useNoticias } from "@/hooks/useNoticias";
import { useLogoSettings } from "@/hooks/useLogoSettings";
import { useNewsConfig } from "@/hooks/useNewsConfig";
import { useWeatherSettings } from "@/hooks/useWeatherSettings";

interface SlideEntry {
  key: string;
  duration: number;
  render: (onVideoEnd?: () => void) => React.ReactNode;
}

const CarrosselEngine = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoEndRef = useRef<(() => void) | null>(null);
  const [climaError, setClimaError] = useState(false);

  const mediaItems = useDisplayItems("media");
  const promoItems = useDisplayItems("promo");
  const noticias = useNoticias();
  const logoSettings = useLogoSettings();
  const newsConfig = useNewsConfig();
  const weatherSettings = useWeatherSettings();

  const buildQueue = useCallback((): SlideEntry[] => {
    const queue: SlideEntry[] = [];

    // 1. Relógio
    queue.push({
      key: "relogio",
      duration: 8,
      render: () => <SlideRelogio />,
    });

    // 2. Clima (single slide with all days, repeated N times)
    if (!climaError && weatherSettings.weatherEnabled) {
      const repeat = weatherSettings.weatherRepeat || 1;
      for (let r = 0; r < repeat; r++) {
        queue.push({
          key: `clima-${r}`,
          duration: weatherSettings.weatherDuration,
          render: () => (
            <SlideClima
              onError={() => setClimaError(true)}
              city={weatherSettings.weatherCity}
              state={weatherSettings.weatherState}
              forecastDays={weatherSettings.weatherForecastDays}
            />
          ),
        });
      }
    }

    // 3. Interleave promos/media with news based on frequency config
    const contentSlides: SlideEntry[] = [];

    // Add all promos
    promoItems.forEach((promo, i) => {
      contentSlides.push({
        key: `promo-${i}`,
        duration: promo.duracao_segundos || 10,
        render: () => (
          <SlidePromocao
            mediaUrl={promo.media_url || ""}
            overlayText={promo.overlay_text || undefined}
            precoDe={promo.preco_de}
            precoPor={promo.preco_por}
          />
        ),
      });
    });

    // Add all media
    mediaItems.forEach((item, i) => {
      contentSlides.push({
        key: `media-${i}`,
        duration: item.duracao_segundos || 10,
        render: (onVideoEnd) => (
          <SlideMidia mediaUrl={item.media_url || ""} onVideoEnd={onVideoEnd} />
        ),
      });
    });

    // Build news slides
    const newsSlides: SlideEntry[] = noticias.map((n, i) => ({
      key: `noticia-${i}`,
      duration: 8,
      render: () => (
        <SlideNoticia
          title={n.title}
          description={n.description}
          duration={8}
          source={n.source}
          imageUrl={n.imageUrl}
        />
      ),
    }));

    // Interleave: every `mediasPerNews` content slides, insert `frequency` news
    if (contentSlides.length > 0 && newsSlides.length > 0) {
      const { mediasPerNews, frequency } = newsConfig;
      let newsIdx = 0;

      for (let i = 0; i < contentSlides.length; i++) {
        queue.push(contentSlides[i]);

        // After every mediasPerNews content items, insert news
        if ((i + 1) % mediasPerNews === 0 && newsIdx < newsSlides.length) {
          for (let f = 0; f < frequency && newsIdx < newsSlides.length; f++) {
            queue.push(newsSlides[newsIdx]);
            newsIdx++;
          }
        }
      }

      // Append remaining news at the end
      while (newsIdx < newsSlides.length) {
        queue.push(newsSlides[newsIdx]);
        newsIdx++;
      }
    } else if (contentSlides.length > 0) {
      queue.push(...contentSlides);
    } else if (newsSlides.length > 0) {
      queue.push(...newsSlides);
    }

    return queue.length > 0 ? queue : [{
      key: "relogio-fallback",
      duration: 8,
      render: () => <SlideRelogio />,
    }];
  }, [climaError, noticias, mediaItems, promoItems, newsConfig, weatherSettings]);

  const queue = buildQueue();

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % queue.length);
      setVisible(true);
      if (climaError) setClimaError(false);
    }, 500);
  }, [queue.length, climaError]);

  useEffect(() => {
    videoEndRef.current = advance;
  }, [advance]);

  const handleVideoEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    videoEndRef.current?.();
  }, []);

  useEffect(() => {
    const safeIndex = currentIndex % queue.length;
    const slide = queue[safeIndex];
    if (!slide) return;

    timerRef.current = setTimeout(advance, slide.duration * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, queue, advance]);

  const safeIndex = currentIndex % queue.length;
  const currentSlide = queue[safeIndex];

  return (
    <div className="w-screen h-screen bg-background overflow-hidden relative">
      <div
        className="w-full h-full transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
        key={currentSlide?.key}
      >
        {currentSlide?.render(handleVideoEnd)}
      </div>

      {/* Logo overlay */}
      {logoSettings.logoUrl && (
        <img
          src={logoSettings.logoUrl}
          alt="Logo"
          className="absolute object-contain pointer-events-none z-40"
          style={{
            width: `${logoSettings.logoSize}%`,
            maxHeight: `${logoSettings.logoSize}%`,
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7)) drop-shadow(0 0 2px rgba(0,0,0,0.5))",
            ...positionToStyle(logoSettings.logoPosition),
          }}
        />
      )}
    </div>
  );
};

export default CarrosselEngine;
