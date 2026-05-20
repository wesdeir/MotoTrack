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
        style={{ marginBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 8px)' }}
      >
        <div className="bg-white dark:bg-white/[0.06] dark:backdrop-blur-md dark:border dark:border-white/[0.10] rounded-2xl overflow-hidden">
          <div className="px-4 py-4 text-center border-b border-gray-100 dark:border-white/[0.08]">
            <p className="text-base font-semibold text-black dark:text-white">{title}</p>
            {message && (
              <p className="text-sm text-ios-gray dark:text-gray-400 mt-1">{message}</p>
            )}
          </div>
          <button
            onClick={onConfirm}
            className={`w-full px-4 py-4 text-base font-semibold active:bg-gray-50 dark:active:bg-white/[0.05] ${
              destructive ? 'text-ios-red' : 'text-ios-blue'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-white dark:bg-white/[0.06] dark:backdrop-blur-md dark:border dark:border-white/[0.10] rounded-2xl px-4 py-4 text-base font-semibold text-ios-blue active:bg-gray-50 dark:active:bg-white/[0.05]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
