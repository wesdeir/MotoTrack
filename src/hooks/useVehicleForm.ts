import { useState } from 'react';
import {
  type VehicleForm,
  emptyVehicleForm,
  validateVehicleForm,
} from '../utils/vehicleForm';
import { decodeVin } from '../utils/vinDecoder';
import { lookupTankSizeLitres } from '../utils/epaVehicleData';

export function useVehicleForm(initialForm?: VehicleForm) {
  const [form, setForm] = useState<VehicleForm>(initialForm ?? emptyVehicleForm());
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [decoding, setDecoding] = useState(false);
  const [lookingUpTank, setLookingUpTank] = useState(false);

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

  /** Decode VIN and populate form fields. Returns `true` on success. Tank size
   *  lookup happens in the background — doesn't block the resolution. */
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
        // Fire-and-forget tank-size lookup. If found, populate only when the
        // user hasn't entered a value themselves.
        void lookupTankSizeLitres(result.year, result.make, result.model).then((litres) => {
          if (litres == null) return;
          setForm((p) => (p.tankSizeLitres === '' ? { ...p, tankSizeLitres: litres } : p));
        });
        return true;
      }
      return false;
    } finally {
      setDecoding(false);
    }
  };

  /** Manual EPA tank-size lookup using whatever year/make/model is in the form.
   *  Returns true on success. Used by the "Look up" button next to the tank
   *  size field — handy when the user typed make/model without a VIN. */
  const handleLookupTankSize = async (): Promise<boolean> => {
    if (!form.year || !form.make.trim() || !form.model.trim()) return false;
    setLookingUpTank(true);
    try {
      const litres = await lookupTankSizeLitres(
        Number(form.year),
        form.make.trim(),
        form.model.trim(),
      );
      if (litres == null) return false;
      setForm((p) => ({ ...p, tankSizeLitres: litres }));
      return true;
    } finally {
      setLookingUpTank(false);
    }
  };

  return {
    form, errors, setField, setForm, setErrors, validate, reset,
    decoding, handleDecodeVin,
    lookingUpTank, handleLookupTankSize,
  };
}
