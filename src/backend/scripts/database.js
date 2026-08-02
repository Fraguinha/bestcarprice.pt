import pg from "pg";
import bcrypt from "bcryptjs";

const DATABASE = process.env.DATABASE || "postgresql://localhost:5432/stand";

const pool = new pg.Pool({ connectionString: DATABASE });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        version TEXT,
        year INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        fuel TEXT NOT NULL,
        transmission TEXT NOT NULL,
        power INTEGER NOT NULL,
        displacement INTEGER,
        color TEXT NOT NULL,
        doors INTEGER NOT NULL,
        seats INTEGER NOT NULL,
        body_type TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        features TEXT[] NOT NULL DEFAULT '{}',
        images TEXT[] NOT NULL DEFAULT '{}',
        sold BOOLEAN NOT NULL DEFAULT false,
        featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire)
    `);

    const result = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@stand.fraguinha.com"]
    );

    if (result.rows.length === 0) {
      const hash = await bcrypt.hash("changeme", 10);
      await client.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
        ["admin@stand.fraguinha.com", hash, "admin"]
      );
      console.log("Admin user created");
    }

    console.log("Database migration complete");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
