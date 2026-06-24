import type { Theme as NavigationTheme } from '@react-navigation/native';

export type AresThemeName = 'standard' | 'artifact' | 'redAlert' | 'premium';

export type AresTheme = {
  name: AresThemeName;
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    textDim: string;
    accent: string;
    accentMuted: string;
    success: string;
    warning: string;
    error: string;
    black: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radii: {
    none: number;
    sm: number;
    md: number;
  };
  typography: {
    mono: string;
    body: number;
    small: number;
    subtitle: number;
    title: number;
    lineHeight: number;
  };
  motion: {
    fastMs: number;
    standardMs: number;
    slowMs: number;
  };
};

const baseSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const baseTypography = {
  mono: 'Menlo',
  body: 15,
  small: 12,
  subtitle: 17,
  title: 28,
  lineHeight: 22,
};

const baseMotion = {
  fastMs: 120,
  standardMs: 220,
  slowMs: 420,
};

export const themes: Record<AresThemeName, AresTheme> = {
  standard: {
    name: 'standard',
    colors: {
      background: '#050807',
      surface: '#07110f',
      surfaceRaised: '#0b1a16',
      border: '#21463e',
      borderStrong: '#38d8a0',
      text: '#d8fff0',
      textMuted: '#8fcbb7',
      textDim: '#51786d',
      accent: '#43ffb3',
      accentMuted: '#1f7a5d',
      success: '#43ffb3',
      warning: '#ffd166',
      error: '#ff5c7a',
      black: '#000000',
    },
    spacing: baseSpacing,
    radii: { none: 0, sm: 2, md: 4 },
    typography: baseTypography,
    motion: baseMotion,
  },
  artifact: {
    name: 'artifact',
    colors: {
      background: '#080605',
      surface: '#17100b',
      surfaceRaised: '#21170f',
      border: '#6d4b24',
      borderStrong: '#ffb35c',
      text: '#ffe6c7',
      textMuted: '#c79b68',
      textDim: '#775638',
      accent: '#ffb35c',
      accentMuted: '#8c5725',
      success: '#43ffb3',
      warning: '#ffd166',
      error: '#ff5c7a',
      black: '#000000',
    },
    spacing: baseSpacing,
    radii: { none: 0, sm: 2, md: 4 },
    typography: baseTypography,
    motion: baseMotion,
  },
  redAlert: {
    name: 'redAlert',
    colors: {
      background: '#0b0305',
      surface: '#18070b',
      surfaceRaised: '#250a10',
      border: '#70313e',
      borderStrong: '#ff5c7a',
      text: '#ffe1e7',
      textMuted: '#db8998',
      textDim: '#8a4c57',
      accent: '#ff5c7a',
      accentMuted: '#9e2b44',
      success: '#43ffb3',
      warning: '#ffd166',
      error: '#ff5c7a',
      black: '#000000',
    },
    spacing: baseSpacing,
    radii: { none: 0, sm: 2, md: 4 },
    typography: baseTypography,
    motion: baseMotion,
  },
  premium: {
    name: 'premium',
    colors: {
      background: '#05070b',
      surface: '#0a101c',
      surfaceRaised: '#101a2b',
      border: '#314b78',
      borderStrong: '#8db6ff',
      text: '#e2edff',
      textMuted: '#9bb7e5',
      textDim: '#58709b',
      accent: '#8db6ff',
      accentMuted: '#385a90',
      success: '#43ffb3',
      warning: '#ffd166',
      error: '#ff5c7a',
      black: '#000000',
    },
    spacing: baseSpacing,
    radii: { none: 0, sm: 2, md: 4 },
    typography: baseTypography,
    motion: baseMotion,
  },
};

export function createNavigationTheme(theme: AresTheme): NavigationTheme {
  return {
    dark: true,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.warning,
    },
    fonts: {
      regular: { fontFamily: theme.typography.mono, fontWeight: '400' },
      medium: { fontFamily: theme.typography.mono, fontWeight: '500' },
      bold: { fontFamily: theme.typography.mono, fontWeight: '700' },
      heavy: { fontFamily: theme.typography.mono, fontWeight: '800' },
    },
  };
}
