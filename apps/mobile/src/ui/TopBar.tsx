import { StyleSheet, View } from 'react-native';

import { useAresTheme } from '@/src/theme/AresThemeProvider';

import { TerminalText } from './TerminalText';

type TopBarProps = {
  title: string;
  subtitle?: string;
};

export function TopBar({ title, subtitle }: TopBarProps) {
  const { theme } = useAresTheme();

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <TerminalText variant="subtitle" tone="accent">
        {title.toUpperCase()}
      </TerminalText>
      {subtitle ? (
        <TerminalText variant="small" tone="muted">
          {subtitle}
        </TerminalText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
    paddingBottom: 12,
  },
});
