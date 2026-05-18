import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';

type AurenWelcomeScreenProps = {
  onContinue: () => void;
};

export function AurenWelcomeScreen({ onContinue }: AurenWelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.wordmark}>A U R E N</Text>
          <Text style={styles.title}>{'Auren helps you\nstudy smarter'}</Text>
          <Text style={styles.subtitle}>{'One place for explanations,\nquizzes, and study plans.'}</Text>
        </View>

        <View style={styles.authCard}>
          <Pressable onPress={onContinue} style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
            <Text style={styles.appleIcon}></Text>
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </Pressable>

          <Pressable onPress={onContinue} style={({ pressed }) => [styles.lightButton, pressed && styles.pressed]}>
            <Text style={styles.googleMark}>G</Text>
            <Text style={styles.lightButtonText}>Continue with Google</Text>
          </Pressable>

          <Pressable onPress={onContinue} style={({ pressed }) => [styles.lightButton, pressed && styles.pressed]}>
            <Text style={styles.mailIcon}>✉</Text>
            <Text style={styles.lightButtonText}>Continue with Email</Text>
          </Pressable>

          <Pressable onPress={onContinue} style={({ pressed }) => [styles.loginRow, pressed && styles.pressed]}>
            <Text style={styles.loginMuted}>Already have an account? </Text>
            <Text style={styles.loginStrong}>Log in</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 168,
  },
  wordmark: {
    color: '#151922',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginLeft: 12,
  },
  title: {
    marginTop: 64,
    color: '#151922',
    fontSize: 39,
    lineHeight: 48,
    letterSpacing: -1.35,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 30,
    color: '#747985',
    fontSize: 21,
    lineHeight: 30,
    letterSpacing: -0.42,
    fontWeight: '400',
    textAlign: 'center',
  },
  authCard: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 86,
    minHeight: 326,
    borderRadius: 38,
    paddingHorizontal: 28,
    paddingTop: 38,
    paddingBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#111827',
    shadowOpacity: 0.075,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
  appleButton: {
    height: 64,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#111827',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
  appleIcon: {
    color: '#ffffff',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  lightButton: {
    height: 64,
    marginTop: 22,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    ...shadows.tiny,
  },
  lightButtonText: {
    color: '#17191f',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  googleMark: {
    color: '#4285f4',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  mailIcon: {
    color: colors.icon,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '500',
  },
  loginRow: {
    marginTop: 28,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginMuted: {
    color: '#747985',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  loginStrong: {
    color: '#262932',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.995 }],
  },
});
