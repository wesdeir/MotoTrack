import Dexie, { type Table } from 'dexie';
import type { Vehicle, MaintenanceRecord, FuelRecord, Reminder } from '../models';

class MotoTrackDB extends Dexie {
  vehicles!: Table<Vehicle, string>;
  maintenanceRecords!: Table<MaintenanceRecord, string>;
  fuelRecords!: Table<FuelRecord, string>;
  reminders!: Table<Reminder, string>;

  constructor() {
    super('MotoTrackDB');
    this.version(1).stores({
      vehicles: 'id, updatedAt',
      maintenanceRecords: 'id, vehicleId, category, date, odometer',
      fuelRecords: 'id, vehicleId, date, odometer',
      reminders: 'id, vehicleId, serviceType, isActive',
    });
    // v2: add createdAt index to vehicles so orderBy('createdAt') works
    this.version(2).stores({
      vehicles: 'id, updatedAt, createdAt',
    });
  }
}

export const db = new MotoTrackDB();
