import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';

type AurenWelcomeScreenProps = {
  onContinue: () => void;
  onEmailContinue: () => void;
};

const GOOGLE_ICON_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAABmJLR0QA/wD/AP+gvaeTAAAJJElEQVR4nO2be1BU1x3Hv+fevcsuu8trEQW0gkhRUATi+9HEqonWJHbsqDO1akwzmUYnJtaoRM24xprxgYljfYQZUztpbByNNTFKpDHiI5pMFCL4QFFRUEAerrzZx733Pk9y9l3vgkLbu7suRKC85J3z7znnP+f3fd9n5/u8Z+65x2pJkiRJkiRJkiRJkiRJkiRJkiRJkiT9b0F3jKQA3oC7QDXgJfAo8AhQBOgE3AB+DfwM+AjYCLgGJAB7gE9AbeAZcAvYBdYDlwCvgRPAB+BfwAXgPyAI/AEsAGcBXwBNgB3AUsA84AtwGTgI/A2uAi8BG4H9gLrAWGAo8Bt4CZwAJwGrgHPAg8A9YB6wF3gUuAX8At4F3gT+E8o/6v4B3wNOAGcBz4CrwGfA08DnwEPgT8Bf4K7wKfA++BT4EvgMeBu4C7wIjABuA+8CXwJPADcDEwDNgPnApuAO8AWwCzgTnAHuA64C7wNnApeBf4GvAPcB44DFwBTgHnAWuBT8A3wP/A58Bf4BfgK8Bf4DvgE+Bf4G/gX+Cf8Jf4B/gb+BP8J/4R/gz/BH+GP8Bf4M/wt/hT/D3+Af8M/wt/hX/Dv+Ff8O/4d/w7/h3/Dv+Hf8O/4d/w7/h3/Dv+Hf8O/4d/w7/h3/Dv+Hf8O/4d/w7/h3/Dv+Hf8O/4d/w7/h3/Dv+Hf8O/4d/w7/h3/Dv+Hf8O/4d/w7/h3DP8H/AL+WywU6Rr5TAAAAAElFTkSuQmCC';

export function AurenWelcomeScreen({ onContinue, onEmailContinue }: AurenWelcomeScreenProps) {
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
            <Image source={{ uri: GOOGLE_ICON_URI }} style={styles.googleIcon} />
            <Text style={styles.lightButtonText}>Continue with Google</Text>
          </Pressable>

          <Pressable onPress={onEmailContinue} style={({ pressed }) => [styles.lightButton, pressed && styles.pressed]}>
            <Ionicons name="mail-outline" size={28} color={colors.icon} />
            <Text style={styles.lightButtonText}>Continue with Email</Text>
          </Pressable>

          <Pressable onPress={onEmailContinue} style={({ pressed }) => [styles.loginRow, pressed && styles.pressed]}>
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
    paddingTop: 120,
  },
  wordmark: {
    color: '#151922',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 11,
    fontWeight: '400',
    textAlign: 'center',
    marginLeft: 11,
  },
  title: {
    marginTop: 62,
    color: '#151922',
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -1.25,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 24,
    color: '#747985',
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.34,
    fontWeight: '400',
    textAlign: 'center',
  },
  authCard: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 56,
    minHeight: 286,
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 29,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#111827',
    shadowOpacity: 0.07,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  appleButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
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
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  lightButton: {
    height: 56,
    marginTop: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    ...shadows.tiny,
  },
  lightButtonText: {
    color: '#17191f',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  googleIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  loginRow: {
    marginTop: 22,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginMuted: {
    color: '#747985',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  loginStrong: {
    color: '#262932',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.18,
  },
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.995 }],
  },
});
