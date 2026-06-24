import { StyleSheet, View } from 'react-native';

import { useAresTheme } from '@/src/theme/AresThemeProvider';

export function Divider() {
  const { theme } = useAresTheme();
  return <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
});
