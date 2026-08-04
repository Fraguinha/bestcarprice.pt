import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastId = 0;
let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function emitChange() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

export function toast({ title, description, variant = "default" }: Omit<Toast, "id">) {
  const id = String(++toastId);
  toasts = [...toasts, { id, title, description, variant }];
  emitChange();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 5000);
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  const subscribe = useCallback(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  useState(() => {
    const unsub = subscribe();
    return unsub;
  });

  return {
    toasts: state,
    toast,
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id);
      emitChange();
    },
  };
}
