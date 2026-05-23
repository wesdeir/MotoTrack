import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import {
  getRecommendedReminders,
  type RecommendedReminder,
} from '../../utils/recommendedSchedule';
import type { Reminder, Vehicle } from '../../models';

interface Props {
  isOpen: boolean;
  vehicle: Vehicle;
  /** Bulk-create the selected reminders. Each must include vehicleId + isActive. */
  onAdd: (reminders: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  onClose: () => void;
}

/**
 * Preview + bulk-add the recommended maintenance schedule for a vehicle.
 * Tapping a row toggles inclusion; the bottom button writes everything
 * selected as new reminders.
 */
export default function RecommendedRemindersModal({ isOpen, vehicle, onAdd, onClose }: Props) {
  const recommendations = useMemo(() => getRecommendedReminders(vehicle), [vehicle]);

  const [selected, setSelected] = useState<Set<string>>(() => {
    const s = new Set<string>();
    recommendations.forEach((r) => { if (r.defaultSelected) s.add(r.title); });
    return s;
  });

  const [saving, setSaving] = useState(false);

  const toggle = (title: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleAdd = async () => {
    const toCreate = recommendations
      .filter((r) => selected.has(r.title))
      .map((r) => toReminderInsert(r, vehicle));
    if (toCreate.length === 0) return;
    setSaving(true);
    try {
      await onAdd(toCreate);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recommended Reminders">
      <div className="px-5 py-4 space-y-3 pb-8">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-ios-blue/10 dark:bg-ios-blue/[0.12]">
          <Sparkles size={16} className="text-ios-blue mt-0.5 flex-shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-black dark:text-white">
              Based on typical intervals for your {vehicle.year} {vehicle.make}
            </p>
            <p className="text-ios-gray dark:text-gray-400 mt-0.5">
              Tap any item to toggle. You can edit or delete reminders later — these are starting points, not gospel.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {recommendations.map((r) => {
            const isSelected = selected.has(r.title);
            return (
              <button
                key={r.title}
                type="button"
                onClick={() => toggle(r.title)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition active:scale-[0.99] ${
                  isSelected
                    ? 'bg-white/60 dark:bg-white/[0.06] border-ios-blue/40'
                    : 'bg-white/30 dark:bg-white/[0.02] border-white/40 dark:border-white/[0.06]'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                    isSelected
                      ? 'bg-ios-blue'
                      : 'bg-white/60 dark:bg-white/[0.08] border border-white/70 dark:border-white/[0.12]'
                  }`}
                >
                  {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-black dark:text-white">{r.title}</p>
                  <p className="text-[11px] text-ios-gray dark:text-gray-400 mt-0.5">
                    {formatInterval(r)}
                  </p>
                  {r.notes && (
                    <p className="text-[11px] text-ios-gray dark:text-gray-500 mt-0.5 leading-snug">
                      {r.notes}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 space-y-2">
          <Button
            onClick={handleAdd}
            fullWidth
            size="lg"
            loading={saving}
            disabled={selected.size === 0}
          >
            {selected.size === 0 ? 'Select at least one' : `Add ${selected.size} Reminder${selected.size === 1 ? '' : 's'}`}
          </Button>
          <Button onClick={onClose} variant="ghost" fullWidth size="lg">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatInterval(r: RecommendedReminder): string {
  const parts: string[] = [];
  if (r.intervalKm) parts.push(`${r.intervalKm.toLocaleString()} km`);
  if (r.intervalMonths) parts.push(`${r.intervalMonths} mo${r.intervalMonths === 1 ? '' : 's'}`);
  return `Every ${parts.join(' / ')}`;
}

/**
 * Convert a recommendation into a Reminder draft ready for `db.reminders.add`.
 * We don't pre-fill `lastServiceOdometer` or `lastServiceDate` — the reminder
 * stays in "no baseline yet" state until the user actually logs a service for
 * that category, which is the right default for newly-imported schedules.
 */
function toReminderInsert(r: RecommendedReminder, vehicle: Vehicle): Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    vehicleId: vehicle.id,
    serviceType: r.serviceType,
    title: r.title,
    mode: r.mode,
    intervalKm: r.intervalKm,
    intervalMonths: r.intervalMonths,
    isActive: true,
    notes: r.notes,
  };
}
