import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme';

type QuickAction = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  prompt?: string;
};

type AurenQuickActionsProps = {
  actions?: QuickAction[];
  onActionPress?: (action: QuickAction) => void;
};

const defaultActions: QuickAction[] = [
  { id: 'explain', icon: 'book-outline', label: 'Explain' },
  { id: 'quiz', icon: 'help-circle-outline', label: 'Quiz me' },
  { id: 'plan', icon: 'calendar-outline', label: 'Study plan' },
];

export function AurenQuickActions({ actions = defaultActions, onActionPress }: AurenQuickActionsProps) {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => onActionPress?.(action)}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Ionicons name={action.icon} size={23} color="#858690" />
          <Text numberOfLines={1} style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  action: {
    width: 104,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.045)',
    ...shadows.tiny,
  },
  actionPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  actionText: {
    marginTop: 7,
    maxWidth: 88,
    color: colors.text,
    fontSize: 14.5,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: -0.18,
    textAlign: 'center',
  },
});
