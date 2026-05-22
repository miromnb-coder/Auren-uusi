import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function safeHaptic(run: () => Promise<void>) {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await run();
  } catch (error) {
    console.log('Auren haptics error:', error);
  }
}

export const aurenHaptics = {
  softTap() {
    return safeHaptic(() => Haptics.selectionAsync());
  },

  selection() {
    return safeHaptic(() => Haptics.selectionAsync());
  },

  contextMenu() {
    return safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },

  panelOpen() {
    return safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },

  panelClose() {
    return safeHaptic(() => Haptics.selectionAsync());
  },

  sendMessage() {
    return safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },

  answerStart() {
    return safeHaptic(() => Haptics.selectionAsync());
  },

  answerComplete() {
    return safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },

  success() {
    return safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },

  warning() {
    return safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
};
