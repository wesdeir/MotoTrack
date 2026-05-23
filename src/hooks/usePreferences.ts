import { useCallback, useEffect, useState } from 'react';

/** Local-storage-backed boolean preference, sync'd across tabs. */
function useBoolPreference(key: string, fallback: boolean) {
  const read = useCallback((): boolean => {
    try {
      const v = localStorage.getItem(key);
      if (v == null) return fallback;
      return v === 'true';
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const [value, setValue] = useState<boolean>(read);

  const setAndPersist = useCallback(
    (next: boolean) => {
      try { localStorage.setItem(key, String(next)); } catch {
        // intentionally ignore — best-effort persistence
      }
      setValue(next);
    },
    [key],
  );

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key) setValue(read());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, read]);

  return [value, setAndPersist] as const;
}

/** "Celebrate unlocks" — gates confetti + screen flash + vibrate on achievement unlock. */
export function useCelebrateUnlocks() {
  return useBoolPreference('mototrack-celebrate-unlocks', true);
}
