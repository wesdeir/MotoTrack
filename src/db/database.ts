import Dexie, { type Table } from 'dexie';
import type {
  Vehicle,
  MaintenanceRecord,
  FuelRecord,
  Reminder,
  VehicleDocument,
  UnlockedAchievement,
  HealthScoreSnapshot,
} from '../models';

class MotoTrackDB extends Dexie {
  vehicles!: Table<Vehicle, string>;
  maintenanceRecords!: Table<MaintenanceRecord, string>;
  fuelRecords!: Table<FuelRecord, string>;
  reminders!: Table<Reminder, string>;
  documents!: Table<VehicleDocument, string>;
  unlockedAchievements!: Table<UnlockedAchievement, string>;
  healthScoreSnapshots!: Table<HealthScoreSnapshot, string>;

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
    // v3: GloveBox document storage
    this.version(3).stores({
      documents: 'id, vehicleId, type',
    });
    // v4: gamification — unlocked achievements per vehicle
    this.version(4).stores({
      unlockedAchievements: 'id, vehicleId, achievementId, seen, [vehicleId+achievementId]',
    });
    // v6: daily health-score snapshots, used by the Phoenix achievement and
    //     future health-history features. One row per vehicle per day.
    //     (v5 was skipped — `pinned` was added as a no-index optional column.)
    this.version(6).stores({
      healthScoreSnapshots: 'id, vehicleId, date, [vehicleId+date]',
    });
  }
}

export const db = new MotoTrackDB();
