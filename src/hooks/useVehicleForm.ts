import { useState } from 'react';
import {
  type VehicleForm,
  emptyVehicleForm,
  validateVehicleForm,
} from '../utils/vehicleForm';
import { decodeVin } from '../utils/vinDecoder';

export function useVehicleForm(initialForm?: VehicleForm) {
  const [form, setForm] = useState<VehicleForm>(initialForm ?? emptyVehicleForm());
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [decoding, setDecoding] = useState(false);

  const setField = <K extends keyof VehicleForm>(key: K, val: VehicleForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Run validation, set error state, and return the errors map (empty = valid). */
  const validate = (): Partial<Record<keyof VehicleForm, string>> => {
    const errs = validateVehicleForm(form);
    setErrors(errs);
    return errs;
  };

  const reset = (v?: VehicleForm) => {
    setForm(v ?? emptyVehicleForm());
    setErrors({});
  };

  /** Decode VIN and populate form fields. Returns `true` on success. */
  const handleDecodeVin = async (): Promise<boolean> => {
    if (form.vin.length < 17) return false;
    setDecoding(true);
    try {
      const result = await decodeVin(form.vin);
      if (result) {
        setForm((p) => ({
          ...p,
          make: result.make,
          model: result.model,
          year: result.year,
          trim: result.trim ?? p.trim,
          engine: result.engine ?? p.engine,
        }));
        return true;
      }
      return false;
    } finally {
      setDecoding(false);
    }
  };

  return { form, errors, setField, setForm, setErrors, validate, reset, decoding, handleDecodeVin };
}
