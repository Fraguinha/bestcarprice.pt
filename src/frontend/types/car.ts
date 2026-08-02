export interface Car {
  id: number;
  make: string;
  model: string;
  version: string | null;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  power: number;
  displacement: number | null;
  color: string;
  doors: number;
  seats: number;
  body_type: string;
  price: number;
  description: string | null;
  features: string[];
  images: string[];
  sold: boolean;
  featured: boolean;
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
  min_year?: number;
  max_year?: number;
}
