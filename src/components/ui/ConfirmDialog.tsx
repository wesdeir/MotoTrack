interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Delete', destructive = true, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div
        className="relative mx-2 space-y-2 animate-slide-up"
        style={{ marginBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="bg-white dark:bg-ios-dark-card rounded-2xl overflow-hidden">
          <div className="px-4 py-4 text-center border-b border-gray-100 dark:border-zinc-800">
            <p className="text-base font-semibold text-black dark:text-white">{title}</p>
            {message && (
              <p className="text-sm text-ios-gray dark:text-gray-400 mt-1">{message}</p>
            )}
          </div>
          <button
            onClick={onConfirm}
            className={`w-full px-4 py-4 text-base font-semibold active:bg-gray-50 dark:active:bg-zinc-700 ${
              destructive ? 'text-ios-red' : 'text-ios-blue'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-white dark:bg-ios-dark-card rounded-2xl px-4 py-4 text-base font-semibold text-ios-blue active:bg-gray-50 dark:active:bg-zinc-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
