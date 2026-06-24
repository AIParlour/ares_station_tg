import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAresTheme } from '@/src/theme/AresThemeProvider';

type ScreenProps = {
  children: ReactNode;
  centered?: boolean;
};

export function Screen({ children, centered = false }: ScreenProps) {
  const { theme } = useAresTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          centered && styles.centered,
          { padding: theme.spacing.xl, gap: theme.spacing.lg },
        ]}>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
  },
  body: {
    gap: 16,
  },
});
