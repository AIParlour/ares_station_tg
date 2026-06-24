import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type ImpactStyle = 'light' | 'medium' | 'heavy';

export type FeedbackService = {
  selection(): Promise<void>;
  success(): Promise<void>;
  error(): Promise<void>;
  impact(style: ImpactStyle): Promise<void>;
};

const impactStyles: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

async function safeHaptic(action: () => Promise<void>) {
  if (Platform.OS === 'web') return;

  try {
    await action();
  } catch {
    // Haptics are enhancement-only. Never fail gameplay or navigation because
    // a simulator/device does not support a specific feedback primitive.
  }
}

export const feedbackService: FeedbackService = {
  selection: () => safeHaptic(() => Haptics.selectionAsync()),
  success: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  impact: (style) => safeHaptic(() => Haptics.impactAsync(impactStyles[style])),
};
