import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function AurenThinkingBubble() {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.label}>Auren</Text>
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  bubble: {
    minWidth: 92,
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 13,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.04)',
  },
  label: {
    marginBottom: 8,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedSoft,
  },
});
