import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ACTIVE_KEY = 'mototrack-tutorial-active';
const STEP_KEY   = 'mototrack-tutorial-step';

interface TutorialContextValue {
  isActive: boolean;
  step: number;
  /** Which UI element the current step is describing (matched by page components). */
  highlight: string | null;
  start: () => void;
  advance: () => void;
  complete: () => void;
  skip: () => void;
  setHighlight: (id: string | null) => void;
}

const TutorialContext = createContext<TutorialContextValue>({
  isActive: false,
  step: 0,
  highlight: null,
  start: () => {},
  advance: () => {},
  complete: () => {},
  skip: () => {},
  setHighlight: () => {},
});

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState<boolean>(
    () => localStorage.getItem(ACTIVE_KEY) === '1',
  );
  const [step, setStep] = useState<number>(
    () => parseInt(localStorage.getItem(STEP_KEY) ?? '0', 10),
  );
  const [highlight, setHighlightRaw] = useState<string | null>(null);

  const start = useCallback(() => {
    localStorage.setItem(ACTIVE_KEY, '1');
    localStorage.setItem(STEP_KEY, '0');
    setStep(0);
    setIsActive(true);
  }, []);

  const advance = useCallback(() => {
    setStep((prev) => {
      const next = prev + 1;
      localStorage.setItem(STEP_KEY, String(next));
      return next;
    });
  }, []);

  const complete = useCallback(() => {
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(STEP_KEY);
    setIsActive(false);
    setStep(0);
    setHighlightRaw(null);
  }, []);

  const setHighlight = useCallback((id: string | null) => setHighlightRaw(id), []);

  const value = useMemo(
    () => ({ isActive, step, highlight, start, advance, complete, skip: complete, setHighlight }),
    [isActive, step, highlight, start, advance, complete, setHighlight],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => useContext(TutorialContext);
