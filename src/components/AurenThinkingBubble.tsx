import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type AurenThinkingBubbleProps = {
  lines?: string[];
};

export function AurenThinkingBubble({ lines = [] }: AurenThinkingBubbleProps) {
  const visibleLines = lines.length > 0 ? lines.slice(0, 3) : ['Preparing your answer...'];

  return (
    <View style={styles.row}>
      <View style={styles.thinkingBlock}>
        <Text style={styles.label}>Auren</Text>

        <View style={styles.linesStack}>
          {visibleLines.map((line, index) => (
            <Text key={`${line}-${index}`} style={styles.thinkingLine}>
              {line}
            </Text>
          ))}
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
  thinkingBlock: {
    maxWidth: '82%',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  label: {
    marginBottom: 6,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  linesStack: {
    gap: 3,
  },
  thinkingLine: {
    color: '#565b66',
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
});
