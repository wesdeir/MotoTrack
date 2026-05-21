import { useRef, useState } from 'react';
import { Camera, FolderOpen, Trash2, FileText } from 'lucide-react';
import { compressImage, approxSizeKB } from '../../utils/imageUtils';
import ReceiptViewer from './ReceiptViewer';

interface ReceiptUploadProps {
  value: string | undefined;
  fileName: string | undefined;
  onChange: (dataUrl: string, fileName: string) => void;
  onRemove: () => void;
}

const MAX_BYTES = 15_000_000;

export default function ReceiptUpload({ value, fileName, onChange, onRemove }: ReceiptUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isPDF = value?.startsWith('data:application/pdf');

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) { setError('File is too large (max 15 MB)'); return; }
    setLoading(true);
    try {
      let dataUrl: string;
      if (file.type === 'application/pdf') {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        dataUrl = await compressImage(file);
      }
      onChange(dataUrl, file.name);
    } catch {
      setError('Failed to process file — please try again');
    } finally {
      setLoading(false);
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const buttonBase =
    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors bg-white/40 backdrop-blur-sm border border-white/60 dark:bg-white/[0.07] dark:border-white/[0.10] text-gray-700 dark:text-gray-300 active:bg-white/60 dark:active:bg-white/[0.12] disabled:opacity-50';

  const hiddenInputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onInput} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onInput} />
    </>
  );

  if (!value) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} disabled={loading} className={buttonBase}>
            <Camera size={16} className="text-ios-blue" />
            Camera
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={loading} className={buttonBase}>
            <FolderOpen size={16} className="text-ios-blue" />
            Choose File
          </button>
        </div>
        {loading && <p className="text-xs text-center text-ios-gray dark:text-gray-400">Processing…</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hiddenInputs}
      </div>
    );
  }

  const replaceBtn =
    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-white/30 dark:bg-white/[0.05] border border-white/60 dark:border-white/[0.08] text-ios-gray dark:text-gray-400 active:bg-white/50';

  return (
    <div className="space-y-2">
      {/* Preview */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="w-full rounded-xl overflow-hidden border border-white/60 dark:border-white/[0.10] block"
        >
          {isPDF ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 bg-white/30 dark:bg-white/[0.05]">
              <FileText size={32} className="text-ios-blue" />
              <span className="text-xs text-ios-gray dark:text-gray-400 px-3 truncate max-w-full">{fileName ?? 'PDF Receipt'}</span>
              <span className="text-xs text-ios-gray dark:text-gray-500">{approxSizeKB(value)} KB</span>
            </div>
          ) : (
            <img src={value} alt="Receipt" className="w-full max-h-48 object-contain bg-gray-50 dark:bg-white/[0.03]" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:bg-black/70"
          aria-label="Remove receipt"
        >
          <Trash2 size={14} className="text-white" />
        </button>
      </div>

      {!isPDF && (
        <p className="text-xs text-center text-ios-gray dark:text-gray-500">
          {approxSizeKB(value)} KB · tap to view full size
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Replace buttons */}
      <div className="flex gap-2">
        <button type="button" onClick={() => cameraRef.current?.click()} className={replaceBtn}>
          <Camera size={13} className="text-ios-blue" /> Camera
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={replaceBtn}>
          <FolderOpen size={13} className="text-ios-blue" /> File
        </button>
      </div>

      {hiddenInputs}

      {viewerOpen && (
        <ReceiptViewer dataUrl={value} fileName={fileName} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
}
