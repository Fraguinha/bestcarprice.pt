import pg from "pg";

let pool: pg.Pool;

const connect = async (connectionString: string) => {
  pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  client.release();
  console.log("Connected to database");
};

const getPool = () => pool;

export default { connect, getPool };
