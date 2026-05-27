import { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import VehicleFormFields from './VehicleFormFields';
import { useVehicle } from '../../hooks/useVehicle';
import { useVehicleForm } from '../../hooks/useVehicleForm';
import { formToVehicleData } from '../../utils/vehicleForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function VehicleSetupModal({ isOpen, onClose, onComplete }: Props) {
  const { addVehicle } = useVehicle();
  const { form, errors, setField, validate, decoding, handleDecodeVin, lookingUpTank, handleLookupTankSize } = useVehicleForm();
  const [saving, setSaving] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Clean up toast timer on unmount
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  };

  const onDecodeVin = async () => {
    const decoded = await handleDecodeVin();
    showToast(decoded ? 'Vehicle details filled from VIN' : 'VIN not found — fill in manually');
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      // Lazy-load seed module to keep demo data out of the main bundle
      const { clearDemoData } = await import('../../db/seed');
      await clearDemoData();
      await addVehicle(formToVehicleData(form));
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
    onComplete();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Set Up Your Vehicle">
      <div className="px-5 py-4 space-y-3 pb-8">
        <p className="text-sm text-ios-gray dark:text-gray-400">
          Your demo data will be cleared and replaced with your vehicle.
        </p>

        <VehicleFormFields
          form={form}
          errors={errors}
          setField={setField}
          decoding={decoding}
          onDecodeVin={onDecodeVin}
          lookingUpTank={lookingUpTank}
          onLookupTankSize={handleLookupTankSize}
        />

        <div className="pt-2 space-y-2">
          <Button onClick={handleSave} fullWidth size="lg" loading={saving}>
            Get Started
          </Button>
          <Button onClick={handleSkip} variant="ghost" fullWidth size="lg">
            Skip for now
          </Button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900/80 backdrop-blur-xl border border-white/[0.12] text-white rounded-2xl text-sm font-medium shadow-glass-dark animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}
    </Modal>
  );
}
