import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";
import PhotoIndicators from "./PhotoIndicators";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  fullWidth?: boolean;
}

export default function ImageGallery({ images, alt, fullWidth }: ImageGalleryProps) {
  const [navigation, setNavigation] = useState({ index: 0, animate: true, preview: false });
  const current = navigation.index < images.length ? navigation.index : 0;
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(() => new Set());
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(() => {
    if (images.length < 2) return;
    setNavigation(({ index }) => {
      const from = index < images.length ? index : 0;
      const destination = (from + images.length - 1) % images.length;
      return { index: destination, animate: destination === from - 1, preview: false };
    });
  }, [images.length]);

  const next = useCallback(() => {
    if (images.length < 2) return;
    setNavigation(({ index }) => {
      const from = index < images.length ? index : 0;
      const destination = (from + 1) % images.length;
      return { index: destination, animate: destination === from + 1, preview: false };
    });
  }, [images.length]);

  const jumpTo = (index: number) => {
    setNavigation((previous) => {
      if (previous.index === index) return previous;
      const distance = Math.abs(previous.index - index);
      return { index, animate: distance === 1, preview: distance > 1 };
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== containerRef.current) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  useEffect(() => {
    const strip = thumbnailsRef.current;
    if (!strip) return;
    if (typeof IntersectionObserver === "undefined") {
      setLoadedThumbnails((loaded) => images.every((image) => loaded.has(image)) ? loaded : new Set([...loaded, ...images]));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const visibleImages: string[] = [];
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const image = images[Number((entry.target as HTMLElement).dataset.thumbnailIndex)];
        if (image !== undefined) visibleImages.push(image);
        observer.unobserve(entry.target);
      }
      if (visibleImages.length) {
        setLoadedThumbnails((loaded) => {
          if (visibleImages.every((image) => loaded.has(image))) return loaded;
          return new Set([...loaded, ...visibleImages]);
        });
      }
    }, { root: strip });
    strip.querySelectorAll<HTMLButtonElement>("[data-thumbnail-index]").forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, [images]);

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
          className={`flex h-full ${isDragging || !navigation.animate ? "" : "transition-transform duration-300 ease-out"}`}
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(calc(-${current * (100 / images.length)}% + ${dragOffset}px))`,
          }}
        >
          {images.map((img, i) => {
            const isNeighbor = i === current || i === (current + 1) % images.length || i === (current + images.length - 1) % images.length;
            return isNeighbor ? (
              <div
                key={i}
                className="h-full shrink-0"
                style={{
                  width: `${100 / images.length}%`,
                  backgroundImage: i === current && navigation.preview ? `url("${getImageUrl(img, "thumb")}")` : undefined,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              >
                <img
                  src={getImageUrl(img, "gallery")}
                  srcSet={`${getImageUrl(img, "card")} 800w, ${getImageUrl(img, "gallery")} 1280w, ${getImageUrl(img)} 1920w`}
                  sizes="100vw"
                  alt={`${alt} - ${i + 1}`}
                  aria-hidden={i !== current}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                  loading="eager"
                  fetchPriority={i === current ? "high" : "low"}
                />
              </div>
            ) : (
              <div key={i} aria-hidden className="h-full shrink-0" style={{ width: `${100 / images.length}%` }} />
            );
          })}
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
            <PhotoIndicators
              currentIndex={current}
              total={images.length}
              variant="gallery"
              className="absolute bottom-3 left-3 right-3 md:bottom-6"
            />
          </>
        )}
      </div>
      {images.length > 1 && (
        <div
          ref={thumbnailsRef}
          className={`flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${fullWidth ? "px-4 md:px-8 pt-3" : ""}`}
        >
          {images.map((img, i) => (
            <button
              key={i}
              data-thumbnail-index={i}
              aria-label={`${alt} - fotografia ${i + 1}`}
              onClick={() => jumpTo(i)}
              className={`shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-md overflow-hidden transition-all ${
                i === current ? "ring-2 ring-primary" : "ring-0 opacity-60 hover:opacity-100"
              }`}
            >
              {loadedThumbnails.has(img) && (
                <img
                  src={getImageUrl(img, "thumb")}
                  alt={`${alt} thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
