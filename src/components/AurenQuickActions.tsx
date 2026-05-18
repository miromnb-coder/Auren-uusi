import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme';

const actions = [
  { id: 'explain', label: 'Explain' },
  { id: 'quiz', label: 'Quiz me' },
  { id: 'plan', label: 'Study plan' },
];

export function AurenQuickActions() {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <Pressable key={action.id} accessibilityRole="button" style={styles.action}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  action: {
    minHeight: 44,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.tiny,
  },
  actionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
