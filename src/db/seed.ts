import { db } from './database';
import type { Vehicle, MaintenanceRecord, FuelRecord, Reminder } from '../models';

const VEHICLE_ID = 'civic-sir-2002';

const vehicle: Vehicle = {
  id: VEHICLE_ID,
  nickname: 'Civic SiR',
  year: 2002,
  make: 'Honda',
  model: 'Civic',
  trim: 'SiR (EP3)',
  engine: '2.0L DOHC i-VTEC (K20A3)',
  vin: '',
  currentOdometer: 211450,
  units: 'km',
  fuelUnits: 'litres',
  currency: 'CAD',
  createdAt: new Date('2024-10-01'),
  updatedAt: new Date('2025-05-19'),
};

const maintenance: MaintenanceRecord[] = [
  {
    id: 'm01', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Pennzoil 5W-30 Full Synthetic',
    date: new Date('2022-06-15'), odometer: 161000,
    laborCost: 45, partsCost: 35, tax: 10.40, totalCost: 90.40,
    shop: 'Quick Lube Plus',
    notes: 'Reset oil life monitor. Next due 166,000 km.',
    nextDueKm: 166000,
    createdAt: new Date('2022-06-15'), updatedAt: new Date('2022-06-15'),
  },
  {
    id: 'm02', vehicleId: VEHICLE_ID, category: 'filter',
    title: 'Air Filter Replacement – OEM Honda',
    date: new Date('2022-06-15'), odometer: 161000,
    laborCost: 0, partsCost: 28, tax: 3.64, totalCost: 31.64,
    shop: 'Quick Lube Plus',
    nextDueKm: 191000,
    createdAt: new Date('2022-06-15'), updatedAt: new Date('2022-06-15'),
  },
  {
    id: 'm03', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Castrol Edge 5W-30',
    date: new Date('2022-11-10'), odometer: 166200,
    laborCost: 45, partsCost: 35, tax: 10.40, totalCost: 90.40,
    shop: 'Quick Lube Plus',
    nextDueKm: 171200,
    createdAt: new Date('2022-11-10'), updatedAt: new Date('2022-11-10'),
  },
  {
    id: 'm04', vehicleId: VEHICLE_ID, category: 'brakes',
    title: 'Front Brake Pads – EBC Greenstuff',
    date: new Date('2023-01-20'), odometer: 168500,
    laborCost: 145, partsCost: 72, tax: 28.21, totalCost: 245.21,
    shop: 'AJ\'s Auto Service',
    notes: 'Front rotors measured at 24.8mm, still within spec. Pads replaced, rotors machined.',
    parts: [
      { name: 'EBC Greenstuff DP2985 Front Pads', partNumber: 'DP2985', cost: 72 },
    ],
    nextDueKm: 188500,
    createdAt: new Date('2023-01-20'), updatedAt: new Date('2023-01-20'),
  },
  {
    id: 'm05', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Castrol Edge 5W-30',
    date: new Date('2023-04-08'), odometer: 171800,
    laborCost: 45, partsCost: 38, tax: 10.79, totalCost: 93.79,
    shop: 'Quick Lube Plus',
    nextDueKm: 176800,
    createdAt: new Date('2023-04-08'), updatedAt: new Date('2023-04-08'),
  },
  {
    id: 'm06', vehicleId: VEHICLE_ID, category: 'coolant',
    title: 'Coolant Flush & Fill – Honda Long Life Blue',
    date: new Date('2023-04-08'), odometer: 171800,
    laborCost: 75, partsCost: 42, tax: 15.21, totalCost: 132.21,
    shop: 'AJ\'s Auto Service',
    notes: 'Flushed system, refilled with OEM Honda Long Life Blue coolant diluted 50/50. System pressure tested.',
    parts: [
      { name: 'Honda Long Life Blue Coolant', partNumber: '08C50-C321S01', cost: 42 },
    ],
    nextDueDate: new Date('2025-04-08'),
    nextDueKm: 211800,
    createdAt: new Date('2023-04-08'), updatedAt: new Date('2023-04-08'),
  },
  {
    id: 'm07', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Mobil 1 5W-30 Full Synthetic',
    date: new Date('2023-09-15'), odometer: 177200,
    laborCost: 45, partsCost: 40, tax: 11.05, totalCost: 96.05,
    shop: 'Quick Lube Plus',
    nextDueKm: 182200,
    createdAt: new Date('2023-09-15'), updatedAt: new Date('2023-09-15'),
  },
  {
    id: 'm08', vehicleId: VEHICLE_ID, category: 'spark-plugs',
    title: 'Spark Plugs – NGK BKR6EIX Iridium (set of 4)',
    date: new Date('2023-09-15'), odometer: 177200,
    laborCost: 55, partsCost: 62, tax: 15.21, totalCost: 132.21,
    shop: 'AJ\'s Auto Service',
    notes: 'Old plugs showed moderate wear at ~60k km. Gapped to 0.8mm. Smooth idle restored.',
    parts: [
      { name: 'NGK BKR6EIX Iridium Spark Plug (x4)', partNumber: 'BKR6EIX', cost: 62 },
    ],
    nextDueKm: 227200,
    createdAt: new Date('2023-09-15'), updatedAt: new Date('2023-09-15'),
  },
  {
    id: 'm09', vehicleId: VEHICLE_ID, category: 'wheel-bearing',
    title: 'Front Wheel Bearing – Driver\'s Side (NSK)',
    date: new Date('2023-12-02'), odometer: 180500,
    laborCost: 220, partsCost: 185, tax: 52.65, totalCost: 457.65,
    shop: 'AJ\'s Auto Service',
    notes: 'Noticeable drone/rumble from front left above 80 km/h. Press-fit bearing replaced. Test drive confirmed fix.',
    parts: [
      { name: 'NSK Front Wheel Bearing LR025', partNumber: 'LR025', cost: 185 },
    ],
    createdAt: new Date('2023-12-02'), updatedAt: new Date('2023-12-02'),
  },
  {
    id: 'm10', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Mobil 1 5W-30 Full Synthetic',
    date: new Date('2024-02-14'), odometer: 183800,
    laborCost: 45, partsCost: 40, tax: 11.05, totalCost: 96.05,
    shop: 'Quick Lube Plus',
    nextDueKm: 188800,
    createdAt: new Date('2024-02-14'), updatedAt: new Date('2024-02-14'),
  },
  {
    id: 'm11', vehicleId: VEHICLE_ID, category: 'transmission-fluid',
    title: 'Manual Transmission Fluid – Honda MTF',
    date: new Date('2024-02-14'), odometer: 183800,
    laborCost: 55, partsCost: 48, tax: 13.39, totalCost: 116.39,
    shop: 'AJ\'s Auto Service',
    notes: 'Shifting felt slightly notchy in cold weather. Fluid was dark. Drained and refilled with Honda MTF.',
    parts: [
      { name: 'Honda Manual Transmission Fluid (2L)', partNumber: '08798-9031', cost: 48 },
    ],
    nextDueKm: 223800,
    createdAt: new Date('2024-02-14'), updatedAt: new Date('2024-02-14'),
  },
  {
    id: 'm12', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Mobil 1 5W-30 Full Synthetic',
    date: new Date('2024-06-20'), odometer: 189200,
    laborCost: 45, partsCost: 40, tax: 11.05, totalCost: 96.05,
    shop: 'Quick Lube Plus',
    nextDueKm: 194200,
    createdAt: new Date('2024-06-20'), updatedAt: new Date('2024-06-20'),
  },
  {
    id: 'm13', vehicleId: VEHICLE_ID, category: 'brakes',
    title: 'Rear Brake Pads + Rotors – Raybestos',
    date: new Date('2024-08-10'), odometer: 192500,
    laborCost: 185, partsCost: 168, tax: 46.02, totalCost: 399.02,
    shop: 'AJ\'s Auto Service',
    notes: 'Rear pads worn to 2mm. Both rotors below minimum thickness. Full rear brake job.',
    parts: [
      { name: 'Raybestos SP Parts Rear Pads', partNumber: 'SP882PR', cost: 68 },
      { name: 'Raybestos Rear Rotors (x2)', partNumber: '980028', cost: 100 },
    ],
    nextDueKm: 212500,
    createdAt: new Date('2024-08-10'), updatedAt: new Date('2024-08-10'),
  },
  {
    id: 'm14', vehicleId: VEHICLE_ID, category: 'inspection',
    title: 'Annual Safety Inspection',
    date: new Date('2024-09-05'), odometer: 193800,
    laborCost: 145, partsCost: 0, tax: 18.85, totalCost: 163.85,
    shop: 'AJ\'s Auto Service',
    notes: 'Passed. Advisory: front struts showing age but within limits. Right CV boot starting to crack — monitor.',
    nextDueDate: new Date('2025-09-05'),
    createdAt: new Date('2024-09-05'), updatedAt: new Date('2024-09-05'),
  },
  {
    id: 'm15', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Mobil 1 5W-30 Full Synthetic',
    date: new Date('2024-11-22'), odometer: 198400,
    laborCost: 45, partsCost: 40, tax: 11.05, totalCost: 96.05,
    shop: 'Quick Lube Plus',
    nextDueKm: 203400,
    createdAt: new Date('2024-11-22'), updatedAt: new Date('2024-11-22'),
  },
  {
    id: 'm16', vehicleId: VEHICLE_ID, category: 'power-steering-fluid',
    title: 'Power Steering Fluid Flush',
    date: new Date('2024-11-22'), odometer: 198400,
    laborCost: 35, partsCost: 22, tax: 7.41, totalCost: 64.41,
    shop: 'AJ\'s Auto Service',
    notes: 'Fluid was dark brown. Flushed and refilled with Honda PSF.',
    parts: [
      { name: 'Honda Power Steering Fluid (1L)', partNumber: '08206-9002', cost: 22 },
    ],
    nextDueKm: 238400,
    createdAt: new Date('2024-11-22'), updatedAt: new Date('2024-11-22'),
  },
  {
    id: 'm17', vehicleId: VEHICLE_ID, category: 'filter',
    title: 'Cabin Air Filter – OEM Honda',
    date: new Date('2025-02-08'), odometer: 203200,
    laborCost: 0, partsCost: 26, tax: 3.38, totalCost: 29.38,
    shop: 'DIY',
    notes: 'Filter was clogged with debris. Easy 5-min swap behind glove box.',
    parts: [
      { name: 'OEM Honda Cabin Filter', partNumber: '80292-SDG-W01', cost: 26 },
    ],
    nextDueKm: 223200,
    createdAt: new Date('2025-02-08'), updatedAt: new Date('2025-02-08'),
  },
  {
    id: 'm18', vehicleId: VEHICLE_ID, category: 'oil-change',
    title: 'Oil Change – Mobil 1 5W-30 Full Synthetic',
    date: new Date('2025-03-22'), odometer: 206000,
    laborCost: 45, partsCost: 40, tax: 11.05, totalCost: 96.05,
    shop: 'Quick Lube Plus',
    notes: 'Switched to Mobil 1 EP filter for better flow.',
    nextDueKm: 211000,
    createdAt: new Date('2025-03-22'), updatedAt: new Date('2025-03-22'),
  },
];

// 20 fuel fill-ups: Nov 2024 → May 2025 (odo 199,000 → 211,450)
const fuel: FuelRecord[] = [
  {
    id: 'f01', vehicleId: VEHICLE_ID, date: new Date('2024-11-02'),
    odometer: 199000, litres: 44.2, totalCost: 71.45, pricePerLitre: 1.616,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2024-11-02'), updatedAt: new Date('2024-11-02'),
  },
  {
    id: 'f02', vehicleId: VEHICLE_ID, date: new Date('2024-11-16'),
    odometer: 199590, litres: 40.8, totalCost: 65.25, pricePerLitre: 1.599,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2024-11-16'), updatedAt: new Date('2024-11-16'),
  },
  {
    id: 'f03', vehicleId: VEHICLE_ID, date: new Date('2024-11-30'),
    odometer: 200190, litres: 43.1, totalCost: 67.99, pricePerLitre: 1.578,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2024-11-30'), updatedAt: new Date('2024-11-30'),
  },
  {
    id: 'f04', vehicleId: VEHICLE_ID, date: new Date('2024-12-14'),
    odometer: 200780, litres: 41.5, totalCost: 63.10, pricePerLitre: 1.520,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2024-12-14'), updatedAt: new Date('2024-12-14'),
  },
  {
    id: 'f05', vehicleId: VEHICLE_ID, date: new Date('2024-12-28'),
    odometer: 201370, litres: 44.8, totalCost: 68.09, pricePerLitre: 1.520,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2024-12-28'), updatedAt: new Date('2024-12-28'),
  },
  {
    id: 'f06', vehicleId: VEHICLE_ID, date: new Date('2025-01-11'),
    odometer: 201970, litres: 40.2, totalCost: 66.74, pricePerLitre: 1.660,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-01-11'), updatedAt: new Date('2025-01-11'),
  },
  {
    id: 'f07', vehicleId: VEHICLE_ID, date: new Date('2025-01-25'),
    odometer: 202560, litres: 42.9, totalCost: 71.37, pricePerLitre: 1.664,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-01-25'), updatedAt: new Date('2025-01-25'),
  },
  {
    id: 'f08', vehicleId: VEHICLE_ID, date: new Date('2025-02-08'),
    odometer: 203140, litres: 41.6, totalCost: 70.30, pricePerLitre: 1.690,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-02-08'), updatedAt: new Date('2025-02-08'),
  },
  {
    id: 'f09', vehicleId: VEHICLE_ID, date: new Date('2025-02-22'),
    odometer: 203740, litres: 43.5, totalCost: 73.28, pricePerLitre: 1.685,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-02-22'), updatedAt: new Date('2025-02-22'),
  },
  {
    id: 'f10', vehicleId: VEHICLE_ID, date: new Date('2025-03-08'),
    odometer: 204330, litres: 40.9, totalCost: 70.36, pricePerLitre: 1.720,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-03-08'), updatedAt: new Date('2025-03-08'),
  },
  {
    id: 'f11', vehicleId: VEHICLE_ID, date: new Date('2025-03-22'),
    odometer: 204930, litres: 44.1, totalCost: 75.57, pricePerLitre: 1.713,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-03-22'), updatedAt: new Date('2025-03-22'),
  },
  {
    id: 'f12', vehicleId: VEHICLE_ID, date: new Date('2025-04-05'),
    odometer: 205540, litres: 42.3, totalCost: 72.35, pricePerLitre: 1.710,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-04-05'), updatedAt: new Date('2025-04-05'),
  },
  {
    id: 'f13', vehicleId: VEHICLE_ID, date: new Date('2025-04-19'),
    odometer: 206140, litres: 41.8, totalCost: 72.97, pricePerLitre: 1.746,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-04-19'), updatedAt: new Date('2025-04-19'),
  },
  {
    id: 'f14', vehicleId: VEHICLE_ID, date: new Date('2025-04-30'),
    odometer: 206740, litres: 43.6, totalCost: 76.02, pricePerLitre: 1.744,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-04-30'), updatedAt: new Date('2025-04-30'),
  },
  {
    id: 'f15', vehicleId: VEHICLE_ID, date: new Date('2025-05-03'),
    odometer: 207010, litres: 19.8, totalCost: 34.61, pricePerLitre: 1.748,
    fuelGrade: 'regular', fullTank: false,
    notes: 'Partial fill — on a road trip, only had time for a quick top-up.',
    createdAt: new Date('2025-05-03'), updatedAt: new Date('2025-05-03'),
  },
  {
    id: 'f16', vehicleId: VEHICLE_ID, date: new Date('2025-05-07'),
    odometer: 207640, litres: 44.0, totalCost: 77.09, pricePerLitre: 1.752,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-05-07'), updatedAt: new Date('2025-05-07'),
  },
  {
    id: 'f17', vehicleId: VEHICLE_ID, date: new Date('2025-05-10'),
    odometer: 208230, litres: 40.5, totalCost: 70.96, pricePerLitre: 1.752,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10'),
  },
  {
    id: 'f18', vehicleId: VEHICLE_ID, date: new Date('2025-05-14'),
    odometer: 208830, litres: 42.8, totalCost: 75.23, pricePerLitre: 1.757,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-05-14'), updatedAt: new Date('2025-05-14'),
  },
  {
    id: 'f19', vehicleId: VEHICLE_ID, date: new Date('2025-05-17'),
    odometer: 209430, litres: 41.2, totalCost: 72.35, pricePerLitre: 1.756,
    fuelGrade: 'regular', fullTank: true,
    createdAt: new Date('2025-05-17'), updatedAt: new Date('2025-05-17'),
  },
  {
    id: 'f20', vehicleId: VEHICLE_ID, date: new Date('2025-05-19'),
    odometer: 211450, litres: 43.5, totalCost: 76.55, pricePerLitre: 1.760,
    fuelGrade: 'regular', fullTank: true,
    notes: 'Summer blend just switched over.',
    createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19'),
  },
];

// Reminders — mix of statuses for an interesting dashboard
const reminders: Reminder[] = [
  {
    id: 'r01', vehicleId: VEHICLE_ID,
    serviceType: 'oil-change', title: 'Oil Change',
    mode: 'km', intervalKm: 5000,
    lastServiceOdometer: 206000, lastServiceDate: new Date('2025-03-22'),
    isActive: true,
    notes: 'Using Mobil 1 5W-30 Full Synthetic',
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2025-03-22'),
  },
  {
    id: 'r02', vehicleId: VEHICLE_ID,
    serviceType: 'brakes', title: 'Brake Inspection',
    mode: 'km', intervalKm: 20000,
    lastServiceOdometer: 192500, lastServiceDate: new Date('2024-08-10'),
    isActive: true,
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-08-10'),
  },
  {
    id: 'r03', vehicleId: VEHICLE_ID,
    serviceType: 'inspection', title: 'Annual Safety Inspection',
    mode: 'months', intervalMonths: 12,
    lastServiceDate: new Date('2024-09-05'), lastServiceOdometer: 193800,
    isActive: true,
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-09-05'),
  },
  {
    id: 'r04', vehicleId: VEHICLE_ID,
    serviceType: 'coolant', title: 'Coolant Flush',
    mode: 'months', intervalMonths: 24,
    lastServiceDate: new Date('2023-04-08'), lastServiceOdometer: 171800,
    isActive: true,
    notes: 'Also check at 40,000 km intervals',
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2023-04-08'),
  },
  {
    id: 'r05', vehicleId: VEHICLE_ID,
    serviceType: 'spark-plugs', title: 'Spark Plugs',
    mode: 'km', intervalKm: 50000,
    lastServiceOdometer: 177200, lastServiceDate: new Date('2023-09-15'),
    isActive: true,
    notes: 'NGK BKR6EIX Iridium – long life',
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2023-09-15'),
  },
  {
    id: 'r06', vehicleId: VEHICLE_ID,
    serviceType: 'transmission-fluid', title: 'Transmission Fluid',
    mode: 'km', intervalKm: 40000,
    lastServiceOdometer: 183800, lastServiceDate: new Date('2024-02-14'),
    isActive: true,
    notes: 'Honda MTF only',
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-02-14'),
  },
];

/** Write all demo data into an empty DB. Called by initDb.ts on first launch. */
export async function seedDemoData(): Promise<void> {
  await db.transaction('rw', db.vehicles, db.maintenanceRecords, db.fuelRecords, db.reminders, async () => {
    await db.vehicles.add(vehicle);
    await db.maintenanceRecords.bulkAdd(maintenance);
    await db.fuelRecords.bulkAdd(fuel);
    await db.reminders.bulkAdd(reminders);
  });
}

export async function clearAndReseed(): Promise<void> {
  await db.transaction('rw', db.vehicles, db.maintenanceRecords, db.fuelRecords, db.reminders, db.documents, async () => {
    await Promise.all([
      db.vehicles.clear(),
      db.maintenanceRecords.clear(),
      db.fuelRecords.clear(),
      db.reminders.clear(),
      db.documents.clear(),
    ]);
    await db.vehicles.add(vehicle);
    await db.maintenanceRecords.bulkAdd(maintenance);
    await db.fuelRecords.bulkAdd(fuel);
    await db.reminders.bulkAdd(reminders);
  });
}
