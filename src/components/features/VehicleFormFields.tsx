import { Loader2 } from 'lucide-react';
import { FormField, Input, Select } from '../ui/FormField';
import { CURRENCY_OPTIONS, type VehicleForm } from '../../utils/vehicleForm';

interface Props {
  form: VehicleForm;
  errors: Partial<Record<keyof VehicleForm, string>>;
  setField: <K extends keyof VehicleForm>(key: K, val: VehicleForm[K]) => void;
  decoding: boolean;
  onDecodeVin: () => void;
  /** Optional — when provided, shows a "Look up" button next to Tank Size that
   *  queries EPA using the current year/make/model. */
  lookingUpTank?: boolean;
  onLookupTankSize?: () => void;
}

export default function VehicleFormFields({
  form, errors, setField, decoding, onDecodeVin,
  lookingUpTank = false, onLookupTankSize,
}: Props) {
  const canLookupTank =
    !!onLookupTankSize && !!form.year && !!form.make.trim() && !!form.model.trim();
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nickname" error={errors.nickname} required>
          <Input
            value={form.nickname}
            onChange={(e) => setField('nickname', e.target.value)}
            placeholder="e.g. My Civic"
          />
        </FormField>
        <FormField label="Year" error={errors.year} required>
          <Input
            type="number"
            value={form.year}
            onChange={(e) => setField('year', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="2002"
            min={1900}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Make" error={errors.make} required>
          <Input value={form.make} onChange={(e) => setField('make', e.target.value)} placeholder="Honda" />
        </FormField>
        <FormField label="Model" error={errors.model} required>
          <Input value={form.model} onChange={(e) => setField('model', e.target.value)} placeholder="Civic" />
        </FormField>
      </div>

      <FormField label="VIN">
        <div className="flex gap-2">
          <Input
            value={form.vin}
            onChange={(e) => setField('vin', e.target.value.toUpperCase())}
            placeholder="Optional — auto-fills fields"
            className="flex-1"
          />
          <button
            type="button"
            onClick={onDecodeVin}
            disabled={form.vin.length < 17 || decoding}
            className="px-3 py-2 rounded-xl bg-ios-blue text-white text-sm font-semibold disabled:opacity-40 flex-shrink-0 flex items-center gap-1.5"
          >
            {decoding ? <Loader2 size={14} className="animate-spin" /> : null}
            Decode
          </button>
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Trim">
          <Input value={form.trim} onChange={(e) => setField('trim', e.target.value)} placeholder="Optional" />
        </FormField>
        <FormField label="Engine">
          <Input value={form.engine} onChange={(e) => setField('engine', e.target.value)} placeholder="Optional" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Odometer (km)" error={errors.currentOdometer} required>
          <Input
            type="number"
            value={form.currentOdometer}
            onChange={(e) => setField('currentOdometer', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="150000"
            min={0}
          />
        </FormField>
        <FormField label="Tank Size (L)" hint="Auto-fills after VIN decode">
          <div className="flex gap-2">
            <Input
              type="number"
              value={form.tankSizeLitres}
              onChange={(e) => setField('tankSizeLitres', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="50"
              min={0}
              step={0.1}
              className="flex-1 min-w-0"
            />
            {onLookupTankSize && (
              <button
                type="button"
                onClick={onLookupTankSize}
                disabled={!canLookupTank || lookingUpTank}
                title="Look up tank size from EPA"
                className="px-2.5 rounded-xl bg-ios-blue text-white text-xs font-semibold disabled:opacity-40 flex-shrink-0 flex items-center"
              >
                {lookingUpTank ? <Loader2 size={12} className="animate-spin" /> : 'Look up'}
              </button>
            )}
          </div>
        </FormField>
      </div>

      <FormField label="Currency">
        <Select
          value={form.currency}
          onChange={(e) => setField('currency', e.target.value as VehicleForm['currency'])}
          options={CURRENCY_OPTIONS}
        />
      </FormField>
    </>
  );
}
