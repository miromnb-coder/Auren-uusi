import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type AurenThinkingBubbleProps = {
  lines?: string[];
};

export function AurenThinkingBubble({ lines = [] }: AurenThinkingBubbleProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const visibleLines = lines.length > 0 ? lines.slice(0, 3) : ['Preparing your answer...'];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 820,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 820,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 1] });
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.08] });

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Auren</Text>
          <Animated.View style={[styles.liveDot, { opacity: dotOpacity, transform: [{ scale: dotScale }] }]} />
        </View>

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
  bubble: {
    maxWidth: '86%',
    minWidth: 170,
    borderRadius: 25,
    paddingHorizontal: 17,
    paddingTop: 13,
    paddingBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#111827',
    shadowOpacity: 0.045,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  headerRow: {
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: -0.08,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8b8f9a',
  },
  linesStack: {
    gap: 4,
  },
  thinkingLine: {
    color: '#343844',
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
});
