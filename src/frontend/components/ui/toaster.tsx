import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-lg border p-4 shadow-lg bg-background text-foreground animate-in slide-in-from-bottom-5",
            t.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="text-sm opacity-90 mt-1">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
