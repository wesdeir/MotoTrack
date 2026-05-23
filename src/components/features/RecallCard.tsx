import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, ExternalLink, ShieldCheck, X } from 'lucide-react';
import Card from '../ui/Card';
import { useRecalls } from '../../hooks/useRecalls';
import { nhtsaCampaignUrl, type Recall } from '../../utils/recalls';
import { formatDate } from '../../utils/formatters';
import type { Vehicle } from '../../models';

interface Props {
  vehicle: Vehicle;
}

/**
 * Dashboard banner that surfaces active NHTSA recalls for the active vehicle.
 * Renders nothing when there are no unacknowledged recalls — silent in the
 * happy path. Do-not-drive recalls escalate the visual to red.
 */
export default function RecallCard({ vehicle }: Props) {
  const { recalls, unacknowledged, hasDoNotDrive, acknowledge, unacknowledge } = useRecalls(vehicle);
  const [open, setOpen] = useState(false);

  if (unacknowledged.length === 0) return null;

  const accent = hasDoNotDrive ? 'red' : 'orange';
  const accentText  = accent === 'red' ? 'text-ios-red'   : 'text-ios-orange';
  const accentBg    = accent === 'red' ? 'bg-ios-red/10'  : 'bg-ios-orange/10';

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className={`relative border-l-4 ${accent === 'red' ? 'border-l-ios-red' : 'border-l-ios-orange'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${accentBg} flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle size={20} className={accentText} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold uppercase tracking-wide ${accentText}`}>
              {hasDoNotDrive ? 'Do Not Drive — Recall' : 'Open Recall'}
            </p>
            <p className="text-sm font-semibold text-black dark:text-white mt-0.5">
              {unacknowledged.length} active recall{unacknowledged.length === 1 ? '' : 's'} for your vehicle
            </p>
            <p className="text-xs text-ios-gray dark:text-gray-400 mt-0.5 truncate">
              {unacknowledged[0].component.toLowerCase()} — tap to review
            </p>
          </div>
          <ChevronRight size={18} className="text-gray-300 dark:text-white/25 flex-shrink-0" />
        </div>
      </Card>

      {open && (
        <RecallModal
          recalls={recalls}
          unacknowledgedIds={new Set(unacknowledged.map((r) => r.campaignNumber))}
          onAcknowledge={acknowledge}
          onUnacknowledge={unacknowledge}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ---- Modal ---------------------------------------------------------------

interface ModalProps {
  recalls: Recall[];
  unacknowledgedIds: Set<string>;
  onAcknowledge: (id: string) => void;
  onUnacknowledge: (id: string) => void;
  onClose: () => void;
}

function RecallModal({ recalls, unacknowledgedIds, onAcknowledge, onUnacknowledge, onClose }: ModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Open recalls first, then acknowledged ones (greyed).
  const sorted = [...recalls].sort((a, b) => {
    const aOpen = unacknowledgedIds.has(a.campaignNumber);
    const bOpen = unacknowledgedIds.has(b.campaignNumber);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    if (a.parkIt !== b.parkIt) return a.parkIt ? -1 : 1;
    return b.reportReceivedDate.localeCompare(a.reportReceivedDate);
  });

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative bg-white/50 backdrop-blur-2xl border-t border-x border-white/70 shadow-glass dark:bg-[#080E1C]/80 dark:border-white/[0.12] dark:shadow-glass-dark rounded-t-3xl animate-slide-up flex flex-col"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - 24px)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/[0.15]" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/[0.08] flex-shrink-0">
          <h2 className="text-lg font-bold text-black dark:text-white">NHTSA Recalls</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.10] flex items-center justify-center"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-area px-4 py-3 space-y-3">
          {sorted.map((r) => (
            <RecallItem
              key={r.campaignNumber}
              recall={r}
              isOpen={unacknowledgedIds.has(r.campaignNumber)}
              onAcknowledge={() => onAcknowledge(r.campaignNumber)}
              onUnacknowledge={() => onUnacknowledge(r.campaignNumber)}
            />
          ))}

          <p className="text-[11px] text-ios-gray dark:text-gray-500 leading-relaxed px-1 pt-2 pb-1">
            Recall data from NHTSA. Marking resolved hides the recall from the
            Dashboard banner — it doesn't tell the manufacturer or NHTSA anything.
          </p>
        </div>
      </div>
    </div>
  );
}

function RecallItem({
  recall, isOpen, onAcknowledge, onUnacknowledge,
}: {
  recall: Recall;
  isOpen: boolean;
  onAcknowledge: () => void;
  onUnacknowledge: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const dnd = recall.parkIt;
  const accentBorder = dnd ? 'border-l-ios-red' : 'border-l-ios-orange';

  return (
    <div
      className={`rounded-2xl border ${isOpen ? 'bg-white/60 dark:bg-white/[0.06] border-white/70 dark:border-white/[0.12]' : 'bg-gray-100/40 dark:bg-white/[0.02] border-gray-200/50 dark:border-white/[0.06] opacity-70'} ${isOpen ? `border-l-4 ${accentBorder}` : ''}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {dnd && isOpen && (
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ios-red mb-1">
                Do Not Drive
              </p>
            )}
            <p className="text-[13px] font-semibold text-black dark:text-white">
              {recall.component}
            </p>
            <p className="text-[11px] text-ios-gray dark:text-gray-400 mt-0.5">
              Campaign {recall.campaignNumber}
              {recall.reportReceivedDate ? ` · ${formatDate(recall.reportReceivedDate)}` : ''}
            </p>
          </div>
          {!isOpen && (
            <ShieldCheck size={16} className="text-ios-green flex-shrink-0 mt-0.5" />
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-2.5 text-[12px] leading-relaxed">
            <Section label="Summary" body={recall.summary} />
            {recall.consequence && <Section label="Consequence" body={recall.consequence} />}
            {recall.remedy && <Section label="Remedy" body={recall.remedy} />}
          </div>
        )}
      </button>

      <div className="flex items-center gap-2 px-3 pb-3">
        <a
          href={nhtsaCampaignUrl(recall.campaignNumber)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-white/60 dark:bg-white/[0.08] text-ios-blue active:opacity-70"
        >
          <ExternalLink size={11} /> NHTSA
        </a>
        {isOpen ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
            className="ml-auto px-3 py-1.5 rounded-full text-[12px] font-semibold bg-ios-green/15 text-ios-green active:opacity-70"
          >
            Mark Resolved
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUnacknowledge(); }}
            className="ml-auto px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gray-100 dark:bg-white/[0.08] text-ios-gray dark:text-gray-400 active:opacity-70"
          >
            Re-open
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ios-gray dark:text-gray-500 mb-0.5">
        {label}
      </p>
      <p className="text-ios-gray dark:text-gray-300">{body}</p>
    </div>
  );
}
