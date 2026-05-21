import { db } from './database';

const SEEDED_FLAG = 'mototrack_seeded';

/**
 * Called once at app startup. Checks if the DB is empty and seeds it with demo
 * data on first run. The seed module (with its large data arrays) is lazy-loaded
 * so it doesn't inflate the initial JS bundle — it's only fetched on first launch
 * or when the user explicitly loads demo data.
 */
export async function seedDatabase(): Promise<void> {
  if (localStorage.getItem(SEEDED_FLAG)) return;

  const existingVehicles = await db.vehicles.count();
  if (existingVehicles > 0) {
    localStorage.setItem(SEEDED_FLAG, '1'); // sync flag if somehow missing
    return;
  }

  const { seedDemoData } = await import('./seed');
  await seedDemoData();
  localStorage.setItem(SEEDED_FLAG, '1');
}
