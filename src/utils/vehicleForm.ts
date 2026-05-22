import type { Vehicle } from '../models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VehicleForm {
  nickname: string;
  year: number | '';
  make: string;
  model: string;
  trim: string;
  engine: string;
  vin: string;
  currentOdometer: number | '';
  currency: Vehicle['currency'];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CURRENCY_OPTIONS = [
  { value: 'CAD' as const, label: 'CAD ($)' },
  { value: 'USD' as const, label: 'USD ($)' },
];

// ---------------------------------------------------------------------------
// Factory / conversion
// ---------------------------------------------------------------------------

export function emptyVehicleForm(): VehicleForm {
  return {
    nickname: '', year: '', make: '', model: '',
    trim: '', engine: '', vin: '', currentOdometer: '', currency: 'CAD',
  };
}

export function vehicleToForm(v: Vehicle): VehicleForm {
  return {
    nickname: v.nickname,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim ?? '',
    engine: v.engine ?? '',
    vin: v.vin ?? '',
    currentOdometer: v.currentOdometer,
    currency: v.currency ?? 'CAD',
  };
}

/** Convert form state to the data shape `addVehicle` / `updateVehicle` expect. */
export function formToVehicleData(form: VehicleForm): Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    nickname: form.nickname.trim(),
    year: Number(form.year),
    make: form.make.trim(),
    model: form.model.trim(),
    trim: form.trim.trim() || undefined,
    engine: form.engine.trim() || undefined,
    vin: form.vin.trim() || undefined,
    currentOdometer: Number(form.currentOdometer),
    currency: form.currency,
    units: 'km',
    fuelUnits: 'litres',
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateVehicleForm(form: VehicleForm): Partial<Record<keyof VehicleForm, string>> {
  const errs: Partial<Record<keyof VehicleForm, string>> = {};
  if (!form.nickname.trim()) errs.nickname = 'Required';
  if (!form.year || Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear() + 2) {
    errs.year = 'Enter a valid year';
  }
  if (!form.make.trim()) errs.make = 'Required';
  if (!form.model.trim()) errs.model = 'Required';
  if (form.currentOdometer === '' || Number(form.currentOdometer) < 0) {
    errs.currentOdometer = 'Required';
  }
  return errs;
}
