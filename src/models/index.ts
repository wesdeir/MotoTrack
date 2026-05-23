export type MaintenanceCategory =
  | 'oil-change'
  | 'brakes'
  | 'wheel-bearing'
  | 'tires'
  | 'coolant'
  | 'transmission-fluid'
  | 'brake-fluid'
  | 'power-steering-fluid'
  | 'spark-plugs'
  | 'filter'
  | 'inspection'
  | 'other';

export const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  'oil-change': 'Oil Change',
  brakes: 'Brakes',
  'wheel-bearing': 'Wheel Bearing',
  tires: 'Tires',
  coolant: 'Coolant',
  'transmission-fluid': 'Transmission Fluid',
  'brake-fluid': 'Brake Fluid',
  'power-steering-fluid': 'Power Steering Fluid',
  'spark-plugs': 'Spark Plugs',
  filter: 'Filter',
  inspection: 'Inspection',
  other: 'Other',
};

export const CATEGORY_LIST: { value: MaintenanceCategory; label: string }[] = (
  Object.keys(CATEGORY_LABELS) as MaintenanceCategory[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }));

export interface PartUsed {
  name: string;
  partNumber?: string;
  cost: number;
}

export interface Vehicle {
  id: string;
  nickname: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  vin?: string;
  currentOdometer: number;
  units: 'km' | 'miles';
  fuelUnits: 'litres' | 'gallons';
  currency: 'CAD' | 'USD';
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  category: MaintenanceCategory;
  title: string;
  date: Date;
  odometer: number;
  notes?: string;
  parts?: PartUsed[];
  laborCost: number;
  partsCost: number;
  tax: number;
  totalCost: number;
  shop?: string;
  receiptImage?: string;
  receiptFileName?: string;
  nextDueKm?: number;
  nextDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type FuelGrade = 'regular' | 'mid-grade' | 'premium' | 'diesel' | 'e85';

export const FUEL_GRADES: { value: FuelGrade; label: string }[] = [
  { value: 'regular', label: 'Regular (87)' },
  { value: 'mid-grade', label: 'Mid-Grade (89)' },
  { value: 'premium', label: 'Premium (91+)' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'e85', label: 'E85' },
];

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: Date;
  odometer: number;
  litres: number;
  totalCost: number;
  pricePerLitre?: number;
  fuelGrade?: FuelGrade;
  fullTank: boolean;
  notes?: string;
  // Computed by enrichFuelRecords() — not stored in DB
  kmTravelled?: number;
  lPer100km?: number;
  kmPerL?: number;
  costPerKm?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ReminderMode = 'km' | 'months' | 'date';

export type ReminderStatus = 'ok' | 'due-soon' | 'due-now' | 'overdue';

export interface Reminder {
  id: string;
  vehicleId: string;
  serviceType: MaintenanceCategory;
  title: string;
  mode: ReminderMode;
  intervalKm?: number;
  intervalMonths?: number;
  dueDate?: Date;
  lastServiceOdometer?: number;
  lastServiceDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: 'insurance' | 'registration' | 'warranty' | 'other';
  title: string;
  imageData: string;
  fileName?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderWithStatus extends Reminder {
  status: ReminderStatus;
  kmUntilDue?: number;
  daysUntilDue?: number;
  estimatedDueDate?: Date;
  progressPercent?: number;
}

export interface HealthScoreSnapshot {
  id: string;             // crypto.randomUUID()
  vehicleId: string;
  /** YYYY-MM-DD — one snapshot per vehicle per day. */
  date: string;
  /** 0..100 score at the time of snapshot. */
  score: number;
  createdAt: Date;
}

export interface UnlockedAchievement {
  id: string;                // crypto.randomUUID()
  achievementId: string;     // matches an entry in ACHIEVEMENTS
  vehicleId: string;         // achievements are per-vehicle
  unlockedAt: Date;
  /** True until the user has seen the celebration. Used to show "new" indicators. */
  seen: boolean;
  /** True when the user has pinned this badge to the Dashboard showcase. */
  pinned?: boolean;
  /** When the user pinned the badge — used to order showcase + evict oldest at the cap. */
  pinnedAt?: Date;
}
