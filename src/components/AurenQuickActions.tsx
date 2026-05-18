import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../theme';

const actions = [
  { id: 'explain', icon: '▱', label: 'Explain a con...' },
  { id: 'quiz', icon: '▤', label: 'Quiz me' },
  { id: 'plan', icon: '▦', label: 'Make a study...' },
];

export function AurenQuickActions() {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <Pressable key={action.id} accessibilityRole="button" style={styles.action}>
          <Text style={styles.icon}>{action.icon}</Text>
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
    borderColor: colors.border,
    ...shadows.tiny,
  },
  icon: {
    color: '#858690',
    fontSize: 22,
    lineHeight: 24,
    marginBottom: 7,
    fontWeight: '500',
  },
  actionText: {
    maxWidth: 86,
    color: colors.text,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: -0.15,
    textAlign: 'center',
  },
});
