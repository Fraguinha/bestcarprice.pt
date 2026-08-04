import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price === 0) return "Preço sob consulta";
  return price.toLocaleString("pt-PT", { useGrouping: true }).replace(/,/g, " ") + " €";
}

export function registrationMonth(value: string | null): number | null {
  if (value === null) return null;
  const match = /^(0[1-9]|1[0-2])\/([0-9]{4})$/.exec(value);
  if (!match || match[2] === "0000") return null;
  return Number(match[2]) * 12 + Number(match[1]);
}

export function formatPower(power: number): string {
  return power === 0 ? "Potência por confirmar" : `${power} cv`;
}

export function formatDisplacement(displacement: number): string {
  return displacement === 0 ? "Cilindrada por confirmar" : `${displacement} cc`;
}

export function formatMileage(km: number): string {
  return km.toLocaleString("pt-PT", { useGrouping: true }).replace(/,/g, " ") + " km";
}

export function getImageUrl(key: string): string {
  return `/api/images/${key}`;
}
