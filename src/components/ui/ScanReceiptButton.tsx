import { useRef, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { ParsedReceipt } from '../../utils/ocr';

interface Props {
  /** Called when OCR completes with parsed fields. */
  onParsed: (parsed: ParsedReceipt) => void;
  /** Button label override. Defaults to "Scan receipt to fill". */
  label?: string;
}

/**
 * Standalone receipt-scan trigger — opens the camera/file picker, runs OCR,
 * fires `onParsed` with extracted fields. Does NOT persist the image; use
 * `ReceiptUpload` (which now supports `onScanned`) when you want both attach
 * AND auto-fill.
 *
 * Tesseract.js is lazy-imported so the main bundle stays small.
 */
export default function ScanReceiptButton({ onParsed, label = 'Scan receipt to fill' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { scanReceipt } = await import('../../utils/ocr');
      const parsed = await scanReceipt(file);
      onParsed(parsed);
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handle}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-ios-blue/10 dark:bg-ios-blue/15 text-ios-blue active:opacity-70 disabled:opacity-50 transition"
      >
        {busy ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Scanning…
          </>
        ) : (
          <>
            <Sparkles size={14} />
            {label}
          </>
        )}
      </button>
    </>
  );
}
