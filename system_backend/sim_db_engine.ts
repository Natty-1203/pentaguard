import fs from 'fs';
import path from 'path';
import { SimDatabase, defaultSimDb } from './sim_db_data';

const SIM_DB_FILE = path.join(process.cwd(), 'local_penta_guard_db.json');

// Reads local DB file or writes seeds
export let simDb: SimDatabase = { ...defaultSimDb };

try {
  if (fs.existsSync(SIM_DB_FILE)) {
    simDb = JSON.parse(fs.readFileSync(SIM_DB_FILE, 'utf8'));
  } else {
    fs.writeFileSync(SIM_DB_FILE, JSON.stringify(defaultSimDb, null, 2), 'utf8');
  }
} catch (e) {
  console.error("Local database init error, using RAM engine:", e);
}

export const persistDb = () => {
  try {
    fs.writeFileSync(SIM_DB_FILE, JSON.stringify(simDb, null, 2), 'utf8');
  } catch (error) {
    console.error("Failed to commit database block to storage disk:", error);
  }
};

// SQL parser emulator (maps incoming query text to simulated JSON tables)
export async function executeSimulatedQuery(text: string): Promise<{ rows: any[] }> {
  const queryNormalized = text.toLowerCase().trim();

  // Handle common queries sent by application APIs
  if (queryNormalized.includes('select') && queryNormalized.includes('company')) {
    return { rows: simDb.company };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('branch')) {
    return { rows: simDb.branches };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('agent')) {
    return { rows: simDb.agents };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('customer')) {
    return { rows: simDb.customers };
  }
  if (queryNormalized.includes('select') && (queryNormalized.includes('policy') || queryNormalized.includes('policies'))) {
    return { rows: simDb.policies };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('claim')) {
    return { rows: simDb.claims };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('payment_schedule')) {
    return { rows: simDb.payment_schedules };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('payment')) {
    return { rows: simDb.payments };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('documents')) {
    return { rows: simDb.documents };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('agent_commissions')) {
    return { rows: simDb.agent_commissions };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('auto_asset')) {
    return { rows: simDb.auto_assets };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('home_asset')) {
    return { rows: simDb.home_assets };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('subscription_plans')) {
    return { rows: simDb.subscription_plans };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('subscription_invoices')) {
    return { rows: simDb.subscription_invoices };
  }
  if (queryNormalized.includes('select') && queryNormalized.includes('notifications')) {
    return { rows: simDb.notifications };
  }

  // Default response for other transactional queries
  return { rows: [] };
}
