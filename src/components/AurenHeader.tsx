import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type AurenHeaderProps = {
  onOpenMenu?: () => void;
};

export function AurenHeader({ onOpenMenu }: AurenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
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
    height: 82,
    paddingHorizontal: spacing.screenX,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  menuButton: {
    width: 68,
    height: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
  },
  menuButtonPressed: {
    opacity: 0.58,
  },
  menuLine: {
    width: 25,
    height: 2.2,
    borderRadius: 999,
    backgroundColor: '#72737c',
  },
  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.9,
    fontFamily: serifFont,
  },
  placeholder: {
    width: 68,
    height: 56,
  },
});
