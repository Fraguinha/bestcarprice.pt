export interface Car {
  id: number;
  make: string;
  model: string;
  version: string | null;
  registration_date: string | null;
  mileage: number;
  fuel: string;
  transmission: string;
  power: number;
  displacement: number | null;
  color: string;
  seats: number;
  body_type: string;
  origin: "Nacional" | "Importado" | null;
  price: number;
  description: string | null;
  features: string[];
  images: string[];
  featured: boolean;
  sold: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarFilters {
  make?: string;
  fuel?: string;
  transmission?: string;
  body_type?: string;
  min_price?: number;
  max_price?: number;
  min_registration_year?: number;
  max_registration_year?: number;
}
