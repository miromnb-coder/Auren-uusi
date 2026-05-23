import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { AurenThinkingGlyph } from './AurenThinkingGlyph';

type AurenThinkingBubbleProps = {
  lines?: string[];
};

const PREPARING_LINE = 'Preparing your answer';

export function AurenThinkingBubble({ lines = [] }: AurenThinkingBubbleProps) {
  const isPreparing = lines.length === 0;
  const visibleLines = isPreparing ? [PREPARING_LINE] : lines.slice(0, 3);
  const shimmerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPreparing) {
      shimmerProgress.stopAnimation();
      shimmerProgress.setValue(0);
      return undefined;
    }

    shimmerProgress.setValue(0);
    const animation = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 1450,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isPreparing, shimmerProgress]);

  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-72, 220],
  });

  return (
    <View style={styles.row}>
      <AurenThinkingGlyph />

      <View style={styles.thinkingBlock}>
        <Text style={styles.label}>Auren</Text>

        <View style={styles.linesStack}>
          {visibleLines.map((line, index) => {
            const key = `${line}-${index}`;

            if (isPreparing) {
              return (
                <View key={key} style={styles.shimmerLineWrap}>
                  <Text style={styles.thinkingLine}>{line}</Text>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.shimmerLight,
                      {
                        transform: [
                          { translateX: shimmerTranslateX },
                          { rotate: '13deg' },
                        ],
                      },
                    ]}
                  />
                </View>
              );
            }

            return (
              <Text key={key} style={styles.thinkingLine}>
                {line}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  thinkingBlock: {
    flex: 1,
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
  shimmerLineWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 6,
    paddingRight: 2,
  },
  shimmerLight: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 42,
    backgroundColor: 'rgba(255,255,255,0.62)',
    opacity: 0.82,
  },
  thinkingLine: {
    color: '#565b66',
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.18,
  },
});
