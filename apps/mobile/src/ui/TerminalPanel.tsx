import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useAresTheme } from '@/src/theme/AresThemeProvider';

type TerminalPanelProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function TerminalPanel({ children, style }: TerminalPanelProps) {
  const { theme } = useAresTheme();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
  },
});
