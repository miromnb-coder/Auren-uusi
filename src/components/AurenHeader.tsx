import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export function AurenHeader() {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open menu" style={styles.menuButton}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </Pressable>

      <Text style={styles.title}>Auren</Text>

      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: spacing.screenX,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 7,
  },
  menuLine: {
    width: 24,
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.icon,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});
