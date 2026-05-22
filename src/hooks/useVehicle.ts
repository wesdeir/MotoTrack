import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Vehicle } from '../models';

const STORAGE_KEY = 'mototrack_active_vehicle';
const SWITCH_EVENT = 'mototrack_switch_vehicle';

function broadcast(id: string | null) {
  window.dispatchEvent(new CustomEvent(SWITCH_EVENT, { detail: id }));
}

export function useVehicle() {
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  const allVehicles = useLiveQuery(
    () => db.vehicles.orderBy('createdAt').toArray(),
    [],
  );

  // Keep active ID valid whenever the vehicle list changes
  useEffect(() => {
    if (allVehicles === undefined) return;
    if (allVehicles.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      setActiveId(null);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && allVehicles.some((v) => v.id === stored)) {
      setActiveId(stored);
    } else {
      const id = allVehicles[0].id;
      localStorage.setItem(STORAGE_KEY, id);
      setActiveId(id);
    }
  }, [allVehicles]);

  // Sync across multiple mounted instances (e.g. Dashboard + Settings)
  useEffect(() => {
    const handler = (e: Event) => {
      setActiveId((e as CustomEvent<string | null>).detail);
    };
    window.addEventListener(SWITCH_EVENT, handler);
    return () => window.removeEventListener(SWITCH_EVENT, handler);
  }, []);

  // undefined = still loading; null = no vehicles in DB
  const vehicle =
    allVehicles === undefined
      ? undefined
      : (allVehicles.find((v) => v.id === activeId) ?? null);

  const switchVehicle = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveId(id);
    broadcast(id);
  };

  const addVehicle = async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date();
    const id = crypto.randomUUID();
    await db.vehicles.add({ ...data, id, createdAt: now, updatedAt: now });
    localStorage.setItem(STORAGE_KEY, id);
    setActiveId(id);
    broadcast(id);
    return id;
  };

  const updateVehicle = async (id: string, data: Partial<Omit<Vehicle, 'id' | 'createdAt'>>) => {
    await db.vehicles.update(id, { ...data, updatedAt: new Date() });
  };

  const deleteVehicle = async (id: string) => {
    await db.transaction('rw', db.vehicles, db.maintenanceRecords, db.fuelRecords, db.reminders, db.documents, async () => {
      await db.vehicles.delete(id);
      await Promise.all([
        db.maintenanceRecords.where('vehicleId').equals(id).delete(),
        db.fuelRecords.where('vehicleId').equals(id).delete(),
        db.reminders.where('vehicleId').equals(id).delete(),
        db.documents.where('vehicleId').equals(id).delete(),
      ]);
    });
    if (id === activeId) {
      const remaining = await db.vehicles.orderBy('createdAt').toArray();
      const next = remaining[0]?.id ?? null;
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
      setActiveId(next);
      broadcast(next);
    }
  };

  return { vehicle, allVehicles: allVehicles ?? [], activeId, switchVehicle, addVehicle, updateVehicle, deleteVehicle };
}
