import { type ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useAresTheme } from '@/src/theme/AresThemeProvider';

type TerminalTextProps = TextProps & {
  children: ReactNode;
  variant?: 'body' | 'small' | 'subtitle' | 'title';
  tone?: 'default' | 'muted' | 'dim' | 'accent' | 'warning' | 'error' | 'success';
};

export function TerminalText({
  children,
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: TerminalTextProps) {
  const { theme } = useAresTheme();

  const colorByTone = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    dim: theme.colors.textDim,
    accent: theme.colors.accent,
    warning: theme.colors.warning,
    error: theme.colors.error,
    success: theme.colors.success,
  };

  const variantStyle: TextStyle =
    variant === 'title'
      ? { fontSize: theme.typography.title, lineHeight: 34, letterSpacing: 1.4, fontWeight: '800' }
      : variant === 'subtitle'
        ? { fontSize: theme.typography.subtitle, lineHeight: 24, fontWeight: '700' }
        : variant === 'small'
          ? { fontSize: theme.typography.small, lineHeight: 18, letterSpacing: 0.8 }
          : { fontSize: theme.typography.body, lineHeight: theme.typography.lineHeight };

  return (
    <Text
      {...props}
      style={[
        styles.base,
        {
          color: colorByTone[tone],
          fontFamily: theme.typography.mono,
        },
        variantStyle,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
