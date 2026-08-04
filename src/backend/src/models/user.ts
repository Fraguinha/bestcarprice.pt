import database from "../lib/setup/database.js";

export interface User {
  id: number;
  email: string;
  password: string;
  role: string;
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const pool = database.getPool();
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
  const pool = database.getPool();
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0] || null;
};
