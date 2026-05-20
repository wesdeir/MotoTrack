import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative bg-white dark:bg-[#080E1C]/90 dark:backdrop-blur-2xl dark:border-t dark:border-x dark:border-white/[0.10] rounded-t-3xl shadow-ios-lg animate-slide-up flex flex-col"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          maxHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - 24px)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-zinc-600" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/[0.08] flex-shrink-0">
          <h2 className="text-lg font-bold text-black dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center"
          >
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-area">{children}</div>
      </div>
    </div>
  );
}
