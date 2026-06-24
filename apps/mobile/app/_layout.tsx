import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AresThemeProvider, useAresTheme } from '@/src/theme/AresThemeProvider';

export default function RootLayout() {
  return (
    <AresThemeProvider>
      <RootNavigator />
    </AresThemeProvider>
  );
}

function RootNavigator() {
  const { navigationTheme, theme } = useAresTheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            animation: 'fade',
            contentStyle: { backgroundColor: theme.colors.background },
            headerShown: false,
          }}
        />
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
