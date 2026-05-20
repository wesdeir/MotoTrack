import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { enrichFuelRecords } from '../utils/fuelCalc';
import type { FuelRecord } from '../models';

export function useFuel(vehicleId: string | undefined) {
  const rawRecords = useLiveQuery(
    () =>
      vehicleId
        ? db.fuelRecords.where('vehicleId').equals(vehicleId).toArray()
        : Promise.resolve([] as FuelRecord[]),
    [vehicleId],
  );

  const records = useMemo(
    () => enrichFuelRecords(rawRecords ?? []),
    [rawRecords],
  );

  // Silently bump the vehicle's odometer when a fuel reading is higher than stored.
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
    data: Omit<FuelRecord, 'id' | 'createdAt' | 'updatedAt' | 'kmTravelled' | 'lPer100km' | 'kmPerL' | 'costPerKm'>,
  ) => {
    const now = new Date();
    await db.fuelRecords.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    await syncOdometer(data.odometer);
  };

  const updateRecord = async (
    id: string,
    data: Partial<Omit<FuelRecord, 'id' | 'createdAt' | 'kmTravelled' | 'lPer100km' | 'kmPerL' | 'costPerKm'>>,
  ) => {
    await db.fuelRecords.update(id, { ...data, updatedAt: new Date() });
    if (data.odometer != null) await syncOdometer(data.odometer);
  };

  const deleteRecord = async (id: string) => {
    await db.fuelRecords.delete(id);
  };

  return { records, addRecord, updateRecord, deleteRecord };
}
