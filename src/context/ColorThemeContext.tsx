import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Theme catalogue — each entry drives both the swatch preview and the CSS
// variables applied to <html> in dark mode.
// ---------------------------------------------------------------------------

export const COLOR_THEMES = [
  {
    id: 'ocean' as const,
    name: 'Ocean',
    previewGradient: 'linear-gradient(135deg, #5085E0, rgba(80,133,224,0.40))',
  },
  {
    id: 'electric' as const,
    name: 'Electric',
    previewGradient: 'linear-gradient(135deg, #22D3EE, rgba(34,211,238,0.40))',
  },
  {
    id: 'aurora' as const,
    name: 'Aurora',
    previewGradient: 'linear-gradient(135deg, #8B5CF6, rgba(139,92,246,0.40))',
  },
  {
    id: 'emerald' as const,
    name: 'Emerald',
    previewGradient: 'linear-gradient(135deg, #10B981, rgba(16,185,129,0.40))',
  },
  {
    id: 'sunset' as const,
    name: 'Sunset',
    previewGradient: 'linear-gradient(135deg, #FB923C, rgba(251,146,60,0.40))',
  },
] as const;

export type ColorThemeId = (typeof COLOR_THEMES)[number]['id'];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ColorThemeContextValue {
  colorTheme: ColorThemeId;
  setColorTheme: (id: ColorThemeId) => void;
}

const STORAGE_KEY = 'color-theme';
const DEFAULT: ColorThemeId = 'ocean';

const ColorThemeContext = createContext<ColorThemeContextValue>({
  colorTheme: DEFAULT,
  setColorTheme: () => {},
});

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorThemeId | null;
    // Validate stored value is still a known theme
    return COLOR_THEMES.some((t) => t.id === stored) ? stored! : DEFAULT;
  });

  useEffect(() => {
    const el = document.documentElement;
    // Remove all existing theme classes then apply the selected one
    el.classList.remove(...COLOR_THEMES.map((t) => `theme-${t.id}`));
    el.classList.add(`theme-${colorTheme}`);
  }, [colorTheme]);

  const setColorTheme = useCallback((id: ColorThemeId) => {
    localStorage.setItem(STORAGE_KEY, id);
    setColorThemeState(id);
  }, []);

  const value = useMemo(
    () => ({ colorTheme, setColorTheme }),
    [colorTheme, setColorTheme],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export const useColorTheme = () => useContext(ColorThemeContext);
