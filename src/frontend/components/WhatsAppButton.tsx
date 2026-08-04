import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/constants";
import { useState, useEffect, useCallback } from "react";

export default function WhatsAppButton() {
  const [ping, setPing] = useState(true);

  const triggerPing = useCallback(() => {
    setPing(false);
    requestAnimationFrame(() => setPing(true));
  }, []);

  useEffect(() => {
    let id = setInterval(triggerPing, 3000);

    const handleVisibility = () => {
      clearInterval(id);
      if (document.visibilityState === "visible") {
        triggerPing();
        id = setInterval(triggerPing, 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [triggerPing]);

  return (
    <a
      href={SITE.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BA5C] hover:scale-110 transition-all duration-300"
      aria-label="Contactar via WhatsApp"
    >
      {ping && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-40 animate-ping [animation-iteration-count:1]" />
      )}
      <MessageCircle className="h-6 w-6 relative" />
    </a>
  );
}
