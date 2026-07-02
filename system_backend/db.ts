import dotenv from 'dotenv';
import pg from 'pg';
import { dbState } from './db_state';
import { executeSimulatedQuery } from './sim_db_engine';

dotenv.config();

const { Pool } = pg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pentaguard',
  connectionString: process.env.DATABASE_URL || undefined,
};

let pool: pg.Pool | null = null;

try {
  const hasConfig = process.env.DATABASE_URL || process.env.DB_HOST;
  if (hasConfig) {
    pool = new Pool(dbConfig);
    pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.warn('⚠️ Real PostgreSQL configured but could not connect. Falling back to local database engine.', err.message);
        pool = null;
        dbState.isRealPostgres = false;
      } else {
        console.log('Connected to real PostgreSQL Database successfully');
        dbState.isRealPostgres = true;
      }
    });
  } else {
    console.log('No DB_HOST or DATABASE_URL provided. Operating on local database transaction engine.');
    dbState.isRealPostgres = false;
  }
} catch (e: any) {
  console.warn('Could not initialize PostgreSQL Pool:', e.message);
  pool = null;
  dbState.isRealPostgres = false;
}

export async function executeQuery(text: string, params: any[] = []): Promise<{ rows: any[] }> {
  if (dbState.isRealPostgres && pool) {
    try {
      const res = await pool.query(text, params);
      
      // Map Postgres snake_case to PascalCase for frontend
      const mappedRows = res.rows.map((row: any) => {
        const newRow = { ...row };
        for (const key in row) {
          const mappedKey = key === 'dob' ? 'DOB' : key.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('_');
          if (mappedKey !== key) {
            newRow[mappedKey] = row[key];
          }
        }
        return newRow;
      });
      
      return { rows: mappedRows };
    } catch (realErr: any) {
      console.error(`PostgreSQL execution error on: "${text}"`, realErr.message);
      throw realErr;
    }
  }

  return executeSimulatedQuery(text, params);
}

export { dbService } from './db_service';
