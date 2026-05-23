/**
 * Capture an arbitrary DOM element to a PNG Blob using html2canvas. Lazy-loaded
 * (the library is ~200 KB) so callers should ideally only trigger this from a
 * user gesture.
 */
export async function captureElementToPng(
  el: HTMLElement,
  opts: { background?: string; scale?: number } = {},
): Promise<Blob> {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(el, {
    backgroundColor: opts.background ?? null,
    scale: opts.scale ?? 2,
    useCORS: true,
    logging: false,
  });
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/png',
    );
  });
}

/**
 * Open the system share sheet with the given PNG, falling back to a download
 * if Web Share API doesn't accept files (e.g., desktop Chrome).
 */
export async function shareOrDownloadPng(
  blob: Blob,
  filename: string,
  title?: string,
): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
