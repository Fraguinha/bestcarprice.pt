import database from "../lib/setup/database.js";

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
  featured: boolean;
  registration_date: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CarInput {
  make: string;
  model: string;
  version?: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  power: number;
  displacement?: number;
  color: string;
  doors: number;
  seats: number;
  body_type: string;
  price: number;
  description?: string;
  features: string[];
  images: string[];
  featured?: boolean;
  registration_date?: string;
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

export const findAllCars = async (filters: CarFilters = {}): Promise<Car[]> => {
  const pool = database.getPool();
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters.make) {
    conditions.push(`make = $${idx++}`);
    values.push(filters.make);
  }
  if (filters.fuel) {
    conditions.push(`fuel = $${idx++}`);
    values.push(filters.fuel);
  }
  if (filters.transmission) {
    conditions.push(`transmission = $${idx++}`);
    values.push(filters.transmission);
  }
  if (filters.body_type) {
    conditions.push(`body_type = $${idx++}`);
    values.push(filters.body_type);
  }
  if (filters.min_price) {
    conditions.push(`price >= $${idx++}`);
    values.push(filters.min_price);
  }
  if (filters.max_price) {
    conditions.push(`price <= $${idx++}`);
    values.push(filters.max_price);
  }
  if (filters.min_year) {
    conditions.push(`year >= $${idx++}`);
    values.push(filters.min_year);
  }
  if (filters.max_year) {
    conditions.push(`year <= $${idx++}`);
    values.push(filters.max_year);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT * FROM cars ${where} ORDER BY created_at DESC`,
    values
  );
  return result.rows;
};

export const findCarById = async (id: number): Promise<Car | null> => {
  const pool = database.getPool();
  const result = await pool.query("SELECT * FROM cars WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const findFeaturedCars = async (): Promise<Car[]> => {
  const pool = database.getPool();
  const result = await pool.query(
    "SELECT * FROM cars WHERE featured = true ORDER BY created_at DESC"
  );
  return result.rows;
};

export const createCar = async (input: CarInput): Promise<Car> => {
  const pool = database.getPool();
  const result = await pool.query(
    `INSERT INTO cars (make, model, version, year, mileage, fuel, transmission, power, displacement, color, doors, seats, body_type, price, description, features, images, featured, registration_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     RETURNING *`,
    [
      input.make,
      input.model,
      input.version || null,
      input.year,
      input.mileage,
      input.fuel,
      input.transmission,
      input.power,
      input.displacement || null,
      input.color,
      input.doors,
      input.seats,
      input.body_type,
      input.price,
      input.description || null,
      input.features,
      input.images,
      input.featured || false,
      input.registration_date || null,
    ]
  );
  return result.rows[0];
};

export const updateCar = async (id: number, input: Partial<CarInput>): Promise<Car | null> => {
  const pool = database.getPool();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (input.make !== undefined) { fields.push(`make = $${idx++}`); values.push(input.make); }
  if (input.model !== undefined) { fields.push(`model = $${idx++}`); values.push(input.model); }
  if (input.version !== undefined) { fields.push(`version = $${idx++}`); values.push(input.version || null); }
  if (input.year !== undefined) { fields.push(`year = $${idx++}`); values.push(input.year); }
  if (input.mileage !== undefined) { fields.push(`mileage = $${idx++}`); values.push(input.mileage); }
  if (input.fuel !== undefined) { fields.push(`fuel = $${idx++}`); values.push(input.fuel); }
  if (input.transmission !== undefined) { fields.push(`transmission = $${idx++}`); values.push(input.transmission); }
  if (input.power !== undefined) { fields.push(`power = $${idx++}`); values.push(input.power); }
  if (input.displacement !== undefined) { fields.push(`displacement = $${idx++}`); values.push(input.displacement || null); }
  if (input.color !== undefined) { fields.push(`color = $${idx++}`); values.push(input.color); }
  if (input.doors !== undefined) { fields.push(`doors = $${idx++}`); values.push(input.doors); }
  if (input.seats !== undefined) { fields.push(`seats = $${idx++}`); values.push(input.seats); }
  if (input.body_type !== undefined) { fields.push(`body_type = $${idx++}`); values.push(input.body_type); }
  if (input.price !== undefined) { fields.push(`price = $${idx++}`); values.push(input.price); }
  if (input.description !== undefined) { fields.push(`description = $${idx++}`); values.push(input.description || null); }
  if (input.features !== undefined) { fields.push(`features = $${idx++}`); values.push(input.features); }
  if (input.images !== undefined) { fields.push(`images = $${idx++}`); values.push(input.images); }
  if (input.featured !== undefined) { fields.push(`featured = $${idx++}`); values.push(input.featured); }
  if (input.registration_date !== undefined) { fields.push(`registration_date = $${idx++}`); values.push(input.registration_date || null); }

  if (fields.length === 0) {
    return findCarById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE cars SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const deleteCar = async (id: number): Promise<boolean> => {
  const pool = database.getPool();
  const result = await pool.query("DELETE FROM cars WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};
