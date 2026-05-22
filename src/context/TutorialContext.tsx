import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ACTIVE_KEY = 'mototrack-tutorial-active';
const STEP_KEY   = 'mototrack-tutorial-step';

interface TutorialContextValue {
  isActive: boolean;
  step: number;
  start: () => void;
  advance: () => void;
  complete: () => void;
  skip: () => void;
}

const TutorialContext = createContext<TutorialContextValue>({
  isActive: false,
  step: 0,
  start: () => {},
  advance: () => {},
  complete: () => {},
  skip: () => {},
});

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  // Persist across refreshes so a mid-tutorial reload resumes at the right step
  const [isActive, setIsActive] = useState<boolean>(
    () => localStorage.getItem(ACTIVE_KEY) === '1',
  );
  const [step, setStep] = useState<number>(
    () => parseInt(localStorage.getItem(STEP_KEY) ?? '0', 10),
  );

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
  }, []);

  const value = useMemo(
    () => ({ isActive, step, start, advance, complete, skip: complete }),
    [isActive, step, start, advance, complete],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => useContext(TutorialContext);
