import { useTutorial } from '../context/TutorialContext';

/** Returns the `tutorial-highlight` CSS class when the active tutorial step targets `id`. */
export function useTutorialHighlight(id: string): string {
  const { highlight } = useTutorial();
  return highlight === id ? 'tutorial-highlight' : '';
}
