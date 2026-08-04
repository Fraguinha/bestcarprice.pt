import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  fullWidth?: boolean;
}

export default function ImageGallery({ images, alt, fullWidth }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(
    () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)),
    [images.length],
  );

  const next = useCallback(
    () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)),
    [images.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== containerRef.current) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  const onDragStart = (x: number) => {
    if (images.length < 2) return;
    startX.current = x;
    setIsDragging(true);
  };

  const onDragMove = (x: number) => {
    if (!isDragging) return;
    setDragOffset(x - startX.current);
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset < 0) next();
      else prev();
    }
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => onDragStart(e.touches[0]!.clientX);
  const handleTouchMove = (e: React.TouchEvent) => onDragMove(e.touches[0]!.clientX);
  const handleTouchEnd = () => onDragEnd();

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); onDragStart(e.clientX); };
  const handleMouseMove = (e: React.MouseEvent) => onDragMove(e.clientX);
  const handleMouseUp = () => onDragEnd();
  const handleMouseLeave = () => { if (isDragging) onDragEnd(); };

  if (images.length === 0) {
    return (
      <div className={`${fullWidth ? "aspect-[2/1]" : "aspect-[3/2] rounded-lg"} bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground`}>
        <ImageIcon className="h-12 w-12" />
        <span className="text-sm">Sem imagens disponíveis</span>
      </div>
    );
  }

  return (
    <div className={fullWidth ? "" : "space-y-3"}>
      <div
        ref={containerRef}
        tabIndex={0}
        className={`relative overflow-hidden bg-muted select-none ${fullWidth ? "aspect-[4/3] md:aspect-[2/1]" : "aspect-[3/2] rounded-lg"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`flex h-full ${isDragging ? "" : "transition-transform duration-300 ease-out"}`}
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(calc(-${current * (100 / images.length)}% + ${dragOffset}px))`,
          }}
        >
          {images.map((img, i) => (
            <img
              key={img}
              src={getImageUrl(img)}
              alt={`${alt} - ${i + 1}`}
              className="h-full object-cover pointer-events-none"
              style={{ width: `${100 / images.length}%` }}
              draggable={false}
            />
          ))}
        </div>
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 text-white shadow-lg hover:bg-black/70 border-0 hidden md:flex"
              onClick={prev}
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 text-white shadow-lg hover:bg-black/70 border-0 hidden md:flex"
              onClick={next}
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    idx === current ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className={`flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${fullWidth ? "px-4 md:px-8 pt-3" : ""}`}>
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-md overflow-hidden transition-all ${
                i === current ? "ring-2 ring-primary" : "ring-0 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={getImageUrl(img)}
                alt={`${alt} thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
