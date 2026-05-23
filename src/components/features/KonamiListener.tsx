import { useEffect, useRef } from 'react';
import { useVehicle } from '../../hooks/useVehicle';
import { grantAchievement } from '../../hooks/useAchievements';

const SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

/**
 * Listens for the classic Konami sequence on keydown. When matched, grants
 * the hidden `konami` achievement to the active vehicle. Global — no UI.
 * Keyboard only (desktop / external Bluetooth keyboard); the version-tap
 * easter egg in Settings is the mobile-friendly counterpart.
 */
export default function KonamiListener() {
  const { vehicle } = useVehicle();
  const progressRef = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip if the user is typing in an input — don't hijack form keystrokes
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const expected = SEQUENCE[progressRef.current];
      const key = expected === 'b' || expected === 'a' ? e.key.toLowerCase() : e.key;
      if (key === expected) {
        progressRef.current += 1;
        if (progressRef.current === SEQUENCE.length) {
          progressRef.current = 0;
          if (vehicle) {
            void grantAchievement(vehicle.id, 'konami');
          }
        }
      } else {
        // Reset, but allow this key to start a new attempt if it matches index 0
        progressRef.current = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [vehicle]);

  return null;
}
