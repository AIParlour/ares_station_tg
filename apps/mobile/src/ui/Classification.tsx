import { StyleSheet, View } from 'react-native';

import { useAresTheme } from '@/src/theme/AresThemeProvider';

import { TerminalText } from './TerminalText';

type ClassificationProps = {
  label: string;
  level: string;
};

export function Classification({ label, level }: ClassificationProps) {
  const { theme } = useAresTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.borderStrong }]}>
      <TerminalText variant="small" tone="accent">
        {label}
      </TerminalText>
      <TerminalText variant="small" tone="muted">
        {level}
      </TerminalText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
