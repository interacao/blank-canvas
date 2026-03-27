import { useRef, useEffect } from "react";

interface SlideMidiaProps {
  mediaUrl: string;
  onVideoEnd?: () => void;
}

const isVideo = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

const SlideMidia = ({ mediaUrl, onVideoEnd }: SlideMidiaProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [mediaUrl]);

  if (isVideo(mediaUrl)) {
    return (
      <div className="tv-slide-enter w-full h-full bg-background flex items-center justify-center">
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay
          muted
          playsInline
          onEnded={onVideoEnd}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="tv-slide-enter w-full h-full bg-background">
      <img
        src={mediaUrl}
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default SlideMidia;
