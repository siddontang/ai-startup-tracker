import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL!;
    pool = mysql.createPool({
      uri: url,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}
