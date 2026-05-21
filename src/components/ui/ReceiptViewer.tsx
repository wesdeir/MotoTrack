import { useEffect } from 'react';
import { X, Share2 } from 'lucide-react';
import { dataUrlToBlob } from '../../utils/imageUtils';

interface ReceiptViewerProps {
  dataUrl: string;
  fileName?: string;
  onClose: () => void;
}

export default function ReceiptViewer({ dataUrl, fileName, onClose }: ReceiptViewerProps) {
  const isPDF = dataUrl.startsWith('data:application/pdf');

  // PDF: route through share sheet / new tab immediately, then close
  useEffect(() => {
    if (!isPDF) return;
    const blob = dataUrlToBlob(dataUrl);
    const name = fileName ?? 'receipt.pdf';
    const file = new File([blob], name, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(() => {});
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
    onClose();
  }, [isPDF, dataUrl, fileName, onClose]);

  if (isPDF) return null;

  const handleShare = async () => {
    const blob = dataUrlToBlob(dataUrl);
    const name = fileName ?? 'receipt.jpg';
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name }).catch(() => {});
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 bg-black/60 backdrop-blur-sm flex-shrink-0"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: '12px' }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
          aria-label="Close"
        >
          <X size={20} className="text-white" />
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white text-sm font-medium active:bg-white/20"
        >
          <Share2 size={15} />
          Share
        </button>
      </div>

      {/* Image — CSS pinch-zoom enabled */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <img
          src={dataUrl}
          alt="Receipt"
          className="max-w-full max-h-full object-contain"
          style={{ touchAction: 'pinch-zoom' }}
        />
      </div>
    </div>
  );
}
