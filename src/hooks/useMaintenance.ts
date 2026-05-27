import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { MaintenanceRecord } from '../models';

export function useMaintenance(vehicleId: string | undefined) {
  const records = useLiveQuery(
    () =>
      vehicleId
        ? db.maintenanceRecords
            .where('vehicleId')
            .equals(vehicleId)
            .sortBy('date')
            .then((r) => r.reverse())
        : Promise.resolve([] as MaintenanceRecord[]),
    [vehicleId],
  );

  // Silently bump the vehicle's odometer when a maintenance reading is higher
  // than what's stored. Mirrors useFuel.syncOdometer — keeps the vehicle's
  // currentOdometer in sync without requiring a separate edit.
  async function syncOdometer(odometer: number) {
    if (!vehicleId) return;
    const vehicle = await db.vehicles.get(vehicleId);
    if (vehicle && odometer > vehicle.currentOdometer) {
      await db.vehicles.update(vehicleId, {
        currentOdometer: odometer,
        updatedAt: new Date(),
      });
    }
  }

  const addRecord = async (
    data: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const now = new Date();
    await db.maintenanceRecords.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    await syncOdometer(data.odometer);
  };

  const updateRecord = async (
    id: string,
    data: Partial<Omit<MaintenanceRecord, 'id' | 'createdAt'>>,
  ) => {
    await db.maintenanceRecords.update(id, { ...data, updatedAt: new Date() });
    if (data.odometer != null) await syncOdometer(data.odometer);
  };

  const deleteRecord = async (id: string) => {
    await db.maintenanceRecords.delete(id);
  };

  return {
    records: records ?? [],
    addRecord,
    updateRecord,
    deleteRecord,
  };
}
