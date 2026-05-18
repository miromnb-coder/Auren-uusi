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
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.wordmark}>A U R E N</Text>
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
              <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={27} color="#717784" />
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
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 106,
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
    width: '100%',
    marginTop: 50,
    color: '#151922',
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1.38,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 16,
    color: '#747985',
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.34,
    fontWeight: '400',
    textAlign: 'center',
  },
  formCard: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 60,
    borderRadius: 34,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#111827',
    shadowOpacity: 0.07,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  label: {
    color: '#151922',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  passwordLabel: {
    marginTop: 22,
  },
  input: {
    height: 53,
    marginTop: 10,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    color: '#151922',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.26,
  },
  passwordInputWrap: {
    height: 53,
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 18,
    paddingRight: 12,
    color: '#151922',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.26,
  },
  eyeButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 16,
  },
  forgotText: {
    color: '#747985',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  continueButton: {
    height: 53,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#111827',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  magicButton: {
    height: 53,
    marginTop: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
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
    minHeight: 24,
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
