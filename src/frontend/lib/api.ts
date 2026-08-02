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
  if (filters?.min_year) params.set("min_year", String(filters.min_year));
  if (filters?.max_year) params.set("max_year", String(filters.max_year));
  const query = params.toString();
  return fetchJSON(`${API_ENDPOINTS.CARS}${query ? `?${query}` : ""}`);
}

export async function getFeaturedCars(): Promise<Car[]> {
  return fetchJSON(API_ENDPOINTS.CARS_FEATURED);
}

export async function getCarById(id: number): Promise<Car> {
  return fetchJSON(`${API_ENDPOINTS.CARS}/${id}`);
}

export async function createCar(data: FormData): Promise<Car> {
  const res = await fetch(API_ENDPOINTS.CARS, {
    method: "POST",
    credentials: "include",
    body: data,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Failed to create car");
  }
  return res.json();
}

export async function updateCar(id: number, data: FormData): Promise<Car> {
  const res = await fetch(`${API_ENDPOINTS.CARS}/${id}`, {
    method: "PUT",
    credentials: "include",
    body: data,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Failed to update car");
  }
  return res.json();
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
