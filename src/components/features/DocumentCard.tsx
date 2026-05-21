import { FileText, PencilLine } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import type { VehicleDocument } from '../../models';
import { formatDate } from '../../utils/formatters';

interface Props {
  doc: VehicleDocument;
  onTap: () => void;
  onEdit: () => void;
}

export default function DocumentCard({ doc, onTap, onEdit }: Props) {
  const isImage = doc.imageData.startsWith('data:image');
  const daysUntilExpiry = doc.expiresAt
    ? differenceInDays(new Date(doc.expiresAt), new Date())
    : null;
  const isExpired = daysUntilExpiry != null && daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry != null && !isExpired && daysUntilExpiry <= 30;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <button onClick={onTap} className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.07] flex-shrink-0 flex items-center justify-center">
          {isImage ? (
            <img src={doc.imageData} alt={doc.title} className="w-full h-full object-cover" />
          ) : (
            <FileText size={22} className="text-ios-blue" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-black dark:text-white truncate leading-tight">
            {doc.title}
          </p>
          {doc.expiresAt && (
            <p className={`text-xs mt-0.5 ${
              isExpired ? 'text-ios-red' : isExpiringSoon ? 'text-ios-orange' : 'text-ios-gray dark:text-gray-400'
            }`}>
              {isExpired ? 'Expired ' : isExpiringSoon ? `Expires in ${daysUntilExpiry}d · ` : 'Expires '}
              {formatDate(doc.expiresAt)}
            </p>
          )}
        </div>
      </button>
      <button
        onClick={onEdit}
        className="p-2 text-ios-gray dark:text-gray-500 active:text-ios-blue flex-shrink-0"
        aria-label="Edit document"
      >
        <PencilLine size={16} />
      </button>
    </div>
  );
}
