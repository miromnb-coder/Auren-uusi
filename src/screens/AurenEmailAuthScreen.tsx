import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

type AurenEmailAuthScreenProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function AurenEmailAuthScreen({ onBack, onContinue }: AurenEmailAuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundStage}>
        <View style={styles.topGlow} />
        <View style={styles.centerGlow} />
        <View style={styles.cardGlow} />
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.wordmark}>AUREN</Text>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            Continue with Email
          </Text>
          <Text style={styles.subtitle}>{'Sign in or create your account to save\nyour study progress.'}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#858995"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
          <View style={styles.passwordInputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#858995"
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.passwordInput}
            />
            <Pressable
              onPress={() => setPasswordVisible((current) => !current)}
              hitSlop={12}
              style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            >
              <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={28} color="#717784" />
            </Pressable>
          </View>

          <Pressable style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable onPress={onContinue} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>

          <Pressable onPress={onContinue} style={({ pressed }) => [styles.magicButton, pressed && styles.pressed]}>
            <Text style={styles.magicText}>Send magic link</Text>
          </Pressable>

          <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
            <View style={styles.backLine} />
            <Text style={styles.backText}>Back to sign in</Text>
            <View style={styles.backLine} />
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
  backgroundStage: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: -160,
    left: -90,
    right: -90,
    height: 410,
    borderRadius: 220,
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
  centerGlow: {
    position: 'absolute',
    top: 240,
    left: 58,
    right: 58,
    height: 250,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  cardGlow: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 82,
    height: 330,
    borderRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 82,
    paddingBottom: 24,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  wordmark: {
    color: '#151922',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginLeft: 15,
  },
  title: {
    width: '100%',
    marginTop: 30,
    color: '#151922',
    fontSize: 38,
    lineHeight: 45,
    letterSpacing: -1.45,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 15,
    marginBottom: 30,
    color: '#737987',
    fontSize: 18,
    lineHeight: 27,
    letterSpacing: -0.34,
    fontWeight: '400',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    borderRadius: 38,
    paddingHorizontal: 29,
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#111827',
    shadowOpacity: 0.075,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 22 },
    elevation: 9,
  },
  label: {
    color: '#151922',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  passwordLabel: {
    marginTop: 21,
  },
  input: {
    height: 54,
    marginTop: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
    color: '#151922',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.26,
    shadowColor: '#111827',
    shadowOpacity: 0.025,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  passwordInputWrap: {
    height: 54,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.025,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 18,
    paddingRight: 10,
    color: '#151922',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.26,
  },
  eyeButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 14,
  },
  forgotText: {
    color: '#747985',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  continueButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  magicButton: {
    height: 54,
    marginTop: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#111827',
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 3,
  },
  magicText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  backRow: {
    marginTop: 18,
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  backLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(17,24,39,0.08)',
  },
  backText: {
    color: '#747985',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.16,
  },
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.995 }],
  },
});
