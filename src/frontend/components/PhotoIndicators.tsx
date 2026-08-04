import { useLayoutEffect, useRef, useState } from "react";

interface PhotoIndicatorsProps {
  currentIndex: number;
  total: number;
  variant: "card" | "gallery";
  className: string;
}

type IndicatorLayout = { kind: "full" | "compact" | "count" | "hidden"; visibleCount: number };

export default function PhotoIndicators({ currentIndex, total, variant, className }: PhotoIndicatorsProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const sampleRef = useRef<HTMLSpanElement>(null);
  const sampleDotsRef = useRef<HTMLSpanElement>(null);
  const activeSampleRef = useRef<HTMLSpanElement>(null);
  const inactiveSampleRef = useRef<HTMLSpanElement>(null);
  const countSampleRef = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<IndicatorLayout>({ kind: "hidden", visibleCount: 0 });
  const isCard = variant === "card";
  const dotGapClass = isCard ? "gap-1" : "gap-1.5";
  const activeClass = `block shrink-0 rounded-full bg-white ${isCard ? "h-1.5 w-4" : "h-2 w-6"}`;
  const inactiveClass = `block shrink-0 rounded-full bg-white/50 ${isCard ? "h-1.5 w-1.5" : "h-2 w-2"}`;
  const panelClass = "inline-flex w-max shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-white shadow-sm backdrop-blur-sm";

  useLayoutEffect(() => {
    if (total <= 1) return;
    const slot = slotRef.current;
    const sample = sampleRef.current;
    const sampleDots = sampleDotsRef.current;
    const activeSample = activeSampleRef.current;
    const inactiveSample = inactiveSampleRef.current;
    const countSample = countSampleRef.current;
    if (!slot || !sample || !sampleDots || !activeSample || !inactiveSample || !countSample) return;

    const measure = () => {
      const availableWidth = slot.getBoundingClientRect().width;
      const activeWidth = activeSample.getBoundingClientRect().width;
      const inactiveWidth = inactiveSample.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(sampleDots).columnGap) || 0;
      const dotPitch = inactiveWidth + gap;
      const fixedWidth = sample.getBoundingClientRect().width - sampleDots.getBoundingClientRect().width;
      let next: IndicatorLayout;

      if (activeWidth + (total - 1) * dotPitch <= availableWidth) {
        next = { kind: "full", visibleCount: total };
      } else {
        const visibleCount = dotPitch > 0
          ? Math.min(total, Math.max(0, Math.floor((availableWidth - fixedWidth - activeWidth) / dotPitch) + 1))
          : 0;
        if (visibleCount > 0) {
          next = { kind: "compact", visibleCount };
        } else {
          const panelStyle = getComputedStyle(sample);
          const badgeWidth = countSample.getBoundingClientRect().width
            + parseFloat(panelStyle.paddingLeft) + parseFloat(panelStyle.paddingRight);
          next = badgeWidth <= availableWidth
            ? { kind: "count", visibleCount: 0 }
            : { kind: "hidden", visibleCount: 0 };
        }
      }

      setLayout((previous) =>
        previous.kind === next.kind && previous.visibleCount === next.visibleCount ? previous : next
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    observer.observe(sample);
    return () => observer.disconnect();
  }, [currentIndex, total, variant]);

  if (total <= 1) return null;

  const firstVisible = Math.max(0, Math.min(currentIndex - Math.floor(layout.visibleCount / 2), total - layout.visibleCount));
  const dots = (
    <span className={`flex shrink-0 items-center ${dotGapClass} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`} aria-hidden="true">
      {Array.from({ length: layout.visibleCount }, (_, offset) => {
        const index = firstVisible + offset;
        return (
          <span
            key={index}
            className={`${index === currentIndex ? activeClass : inactiveClass} transition-all duration-300`}
          />
        );
      })}
    </span>
  );

  return (
    <div
      ref={slotRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none flex min-w-0 items-center ${isCard ? "relative justify-end" : "justify-center"} ${className}`}
    >
      <span ref={sampleRef} className={`invisible absolute left-0 top-0 ${panelClass}`} aria-hidden="true">
        <span ref={sampleDotsRef} className={`flex items-center ${dotGapClass}`}>
          <span ref={activeSampleRef} className={activeClass} />
          <span ref={inactiveSampleRef} className={inactiveClass} />
        </span>
        <span ref={countSampleRef} className="block text-xs font-semibold tabular-nums">{currentIndex + 1}/{total}</span>
      </span>
      {layout.kind === "full" && dots}
      {layout.kind === "compact" && (
        <span className={panelClass} aria-hidden="true">
          {dots}
          <span className="text-xs font-semibold tabular-nums">{currentIndex + 1}/{total}</span>
        </span>
      )}
      {layout.kind === "count" && (
        <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-xs font-semibold tabular-nums text-white shadow-sm backdrop-blur-sm" aria-hidden="true">
          {currentIndex + 1}/{total}
        </span>
      )}
      <span className="sr-only">Fotografia {currentIndex + 1} de {total}</span>
    </div>
  );
}
