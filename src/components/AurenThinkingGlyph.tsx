import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function AurenThinkingGlyph() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1850,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => animation.stop();
  }, [progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const softPulse = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.42, 0.95, 0.42],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.92, 1.06, 0.92],
  });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.outerOrbit, { transform: [{ rotate }, { scale }] }]}>
        <View style={[styles.dot, styles.dotTop]} />
        <View style={[styles.dot, styles.dotRight]} />
        <View style={[styles.dot, styles.dotBottom]} />
        <View style={[styles.dot, styles.dotLeft]} />
      </Animated.View>

      <Animated.View style={[styles.innerOrbit, { opacity: softPulse, transform: [{ rotate: reverseRotate }] }]}>
        <View style={styles.innerDot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  outerOrbit: {
    position: 'absolute',
    width: 18,
    height: 18,
  },
  innerOrbit: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  dot: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#171a22',
  },
  dotTop: {
    top: 0,
    left: 7.25,
    opacity: 0.95,
  },
  dotRight: {
    top: 7.25,
    right: 0,
    opacity: 0.72,
  },
  dotBottom: {
    bottom: 0,
    left: 7.25,
    opacity: 0.44,
  },
  dotLeft: {
    top: 7.25,
    left: 0,
    opacity: 0.62,
  },
  innerDot: {
    position: 'absolute',
    top: 0,
    left: 3.5,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#565b66',
  },
});
