import { StyleSheet, View } from 'react-native';

import { useAresTheme } from '@/src/theme/AresThemeProvider';

import { TerminalText } from './TerminalText';

type StatusBadgeProps = {
  label: string;
  tone?: 'success' | 'warning' | 'error' | 'muted';
};

export function StatusBadge({ label, tone = 'muted' }: StatusBadgeProps) {
  const { theme } = useAresTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'error'
          ? theme.colors.error
          : theme.colors.textMuted;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <TerminalText variant="small" tone={tone === 'muted' ? 'muted' : tone}>
        {label}
      </TerminalText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
