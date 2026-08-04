import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice, formatMileage, getImageUrl } from "@/lib/utils";
import type { Car } from "@/types/car";

interface CarCardProps {
  car: Car;
  isNew?: boolean;
}

export default function CarCard({ car, isNew }: CarCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const didSwipe = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMultiple = car.images.length >= 2;

  const goNext = useCallback(() => {
    if (hasMultiple) setCurrentIndex((i) => (i + 1) % car.images.length);
  }, [car.images.length, hasMultiple]);

  const goPrev = useCallback(() => {
    if (hasMultiple) setCurrentIndex((i) => (i - 1 + car.images.length) % car.images.length);
  }, [car.images.length, hasMultiple]);

  const onDragStart = (x: number) => {
    if (!hasMultiple) return;
    startX.current = x;
    setIsDragging(true);
    didSwipe.current = false;
  };

  const onDragMove = (x: number) => {
    if (!isDragging) return;
    setDragOffset(x - startX.current);
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 50) {
      didSwipe.current = true;
      if (dragOffset < 0) goNext();
      else goPrev();
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

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.preventDefault();
      didSwipe.current = false;
    }
  }, []);

  return (
    <Link to={`/car/${car.id}`} className="block" onClick={handleLinkClick}>
      <div className="relative overflow-hidden rounded-xl bg-card hover:shadow-lg transition-shadow duration-300 group">
        <div
          ref={containerRef}
          className="relative aspect-[16/10] overflow-hidden bg-muted select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {car.images.length > 0 ? (
            <div
              className={`flex h-full ${isDragging ? "" : "transition-transform duration-300 ease-out"}`}
              style={{
                width: `${car.images.length * 100}%`,
                transform: `translateX(calc(-${currentIndex * (100 / car.images.length)}% + ${dragOffset}px))`,
              }}
            >
              {car.images.map((img) => (
                <img
                  key={img}
                  src={getImageUrl(img)}
                  alt={`${car.make} ${car.model}`}
                  className="h-full object-cover pointer-events-none"
                  style={{ width: `${100 / car.images.length}%` }}
                  draggable={false} loading="lazy"
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">🚗</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hidden md:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hidden md:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-white text-sm font-bold pointer-events-none">
            {formatPrice(car.price)}
          </span>
          {hasMultiple && (
            <div className="absolute bottom-3 right-3 flex gap-1 pointer-events-none">
              {car.images.map((_, idx) => (
                <span
                  key={idx}
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
          {car.featured && (
            <span className="absolute top-3 left-3 flex h-3 w-3 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
            </span>
          )}
          {isNew && !car.featured && (
            <span className="absolute top-3 left-3 flex h-3 w-3 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-base truncate">
              {car.make} {car.model}
            </h3>
            <Badge variant="secondary" className="text-xs shrink-0">
              {car.transmission === "Manual" ? "Manual" : "Auto"}
            </Badge>
          </div>
          {car.version && (
            <p className="text-sm text-muted-foreground truncate">{car.version}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {car.registration_date || car.year} · {formatMileage(car.mileage)} · {car.fuel} · {car.power} cv
          </p>
        </div>

      </div>
    </Link>
  );
}
