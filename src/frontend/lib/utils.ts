import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return price.toLocaleString("pt-PT", { useGrouping: true }).replace(/,/g, " ") + " €";
}

export function formatMileage(km: number): string {
  return km.toLocaleString("pt-PT", { useGrouping: true }).replace(/,/g, " ") + " km";
}

export function getImageUrl(key: string): string {
  return `/api/images/${key}`;
}
