import { API_ENDPOINTS } from "@/lib/constants";
import type { Car, CarFilters } from "@/types/car";
import type { AuthStatus, LoginResponse } from "@/types/user";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getCars(filters?: CarFilters): Promise<Car[]> {
  const params = new URLSearchParams();
  if (filters?.make) params.set("make", filters.make);
  if (filters?.fuel) params.set("fuel", filters.fuel);
  if (filters?.transmission) params.set("transmission", filters.transmission);
  if (filters?.body_type) params.set("body_type", filters.body_type);
  if (filters?.min_price) params.set("min_price", String(filters.min_price));
  if (filters?.max_price) params.set("max_price", String(filters.max_price));
  const minYear = filters?.min_registration_year;
  if (minYear !== undefined && Number.isInteger(minYear) && minYear >= 1 && minYear <= 9999) {
    params.set("min_registration_year", String(minYear));
  }
  const maxYear = filters?.max_registration_year;
  if (maxYear !== undefined && Number.isInteger(maxYear) && maxYear >= 1 && maxYear <= 9999) {
    params.set("max_registration_year", String(maxYear));
  }
  const query = params.toString();
  return fetchJSON(`${API_ENDPOINTS.CARS}${query ? `?${query}` : ""}`);
}

export async function getFeaturedCars(): Promise<Car[]> {
  return fetchJSON(API_ENDPOINTS.CARS_FEATURED);
}

export async function getCarById(id: number): Promise<Car> {
  return fetchJSON(`${API_ENDPOINTS.CARS}/${id}`);
}

export type CarUploadProgress =
  | { phase: "uploading"; loaded?: number; total?: number }
  | { phase: "processing" };

type ProgressCallback = (progress: CarUploadProgress) => void;

function sendCarForm(
  method: "POST" | "PUT",
  url: string,
  data: FormData,
  onProgress?: ProgressCallback,
): Promise<Car> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress({ phase: "uploading", loaded: event.loaded, total: event.total });
        } else {
          onProgress({ phase: "uploading" });
        }
      });
      xhr.upload.addEventListener("load", () => onProgress({ phase: "processing" }));
    }

    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const error = body && typeof body === "object" && "error" in body ? body.error : null;
        reject(new Error(
          typeof error === "string" && error.trim()
            ? error
            : `Não foi possível guardar a viatura (HTTP ${xhr.status}). Confirme os dados e tente novamente.`,
        ));
        return;
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        reject(new Error("O servidor devolveu uma resposta inesperada. Aguarde e confirme na lista se a viatura foi guardada antes de voltar a submeter."));
        return;
      }

      resolve(body as Car);
    };
    xhr.onerror = () => reject(new Error("Falha na ligação ao servidor. Aguarde e confirme na lista se a viatura foi guardada antes de voltar a submeter."));
    xhr.onabort = () => reject(new Error("O envio foi interrompido. Aguarde e confirme na lista se a viatura foi guardada antes de voltar a submeter."));

    xhr.open(method, url);
    xhr.withCredentials = true;
    onProgress?.({ phase: "uploading" });
    xhr.send(data);
  });
}

export function createCar(data: FormData, onProgress?: ProgressCallback): Promise<Car> {
  return sendCarForm("POST", API_ENDPOINTS.CARS, data, onProgress);
}

export function updateCar(id: number, data: FormData, onProgress?: ProgressCallback): Promise<Car> {
  return sendCarForm("PUT", `${API_ENDPOINTS.CARS}/${id}`, data, onProgress);
}

export async function deleteCar(id: number): Promise<void> {
  await fetchJSON(`${API_ENDPOINTS.CARS}/${id}`, { method: "DELETE" });
}

export async function checkAuthStatus(): Promise<AuthStatus> {
  return fetchJSON(API_ENDPOINTS.AUTH_STATUS, { method: "POST" });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return fetchJSON(API_ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await fetchJSON(API_ENDPOINTS.LOGOUT, { method: "POST" });
}
