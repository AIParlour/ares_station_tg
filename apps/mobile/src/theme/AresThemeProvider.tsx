import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

import {
  createNavigationTheme,
  themes,
  type AresTheme,
  type AresThemeName,
} from './tokens';

type AresThemeContextValue = {
  theme: AresTheme;
  themeName: AresThemeName;
  setThemeName: (name: AresThemeName) => void;
  navigationTheme: ReturnType<typeof createNavigationTheme>;
};

const AresThemeContext = createContext<AresThemeContextValue | null>(null);

export function AresThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<AresThemeName>('standard');

  const value = useMemo<AresThemeContextValue>(() => {
    const theme = themes[themeName];
    return {
      theme,
      themeName,
      setThemeName,
      navigationTheme: createNavigationTheme(theme),
    };
  }, [themeName]);

  return <AresThemeContext.Provider value={value}>{children}</AresThemeContext.Provider>;
}

export function useAresTheme() {
  const context = useContext(AresThemeContext);
  if (!context) {
    throw new Error('useAresTheme must be used inside AresThemeProvider');
  }
  return context;
}
