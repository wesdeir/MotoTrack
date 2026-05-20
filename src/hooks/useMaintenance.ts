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
  };

  const updateRecord = async (
    id: string,
    data: Partial<Omit<MaintenanceRecord, 'id' | 'createdAt'>>,
  ) => {
    await db.maintenanceRecords.update(id, { ...data, updatedAt: new Date() });
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
