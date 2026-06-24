import { Pressable, StyleSheet, View } from 'react-native';

import { feedbackService } from '@/src/platform/services/feedback';
import { useAresTheme } from '@/src/theme/AresThemeProvider';

import { TerminalText } from './TerminalText';

type TerminalButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function TerminalButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: TerminalButtonProps) {
  const { theme } = useAresTheme();

  const color =
    variant === 'danger'
      ? theme.colors.error
      : variant === 'secondary'
        ? theme.colors.textMuted
        : theme.colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={async () => {
        await feedbackService.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: color,
          backgroundColor: pressed ? theme.colors.surfaceRaised : theme.colors.black,
          opacity: disabled ? 0.45 : 1,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}>
      <View style={styles.content}>
        <TerminalText tone={variant === 'danger' ? 'error' : variant === 'secondary' ? 'muted' : 'accent'}>
          {`> ${label.toUpperCase()}`}
        </TerminalText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
