import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={30} color="#717784" />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f4f6',
  },
  backgroundStage: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: -150,
    left: -80,
    right: -80,
    height: 430,
    borderRadius: 220,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  centerGlow: {
    position: 'absolute',
    top: 210,
    left: 34,
    right: 34,
    height: 280,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  cardGlow: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 58,
    height: 360,
    borderRadius: 190,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 110,
    paddingBottom: 54,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  wordmark: {
    color: '#151922',
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: 12.8,
    fontWeight: '400',
    textAlign: 'center',
    marginLeft: 12.8,
  },
  title: {
    width: '100%',
    marginTop: 52,
    color: '#151922',
    fontSize: 41,
    lineHeight: 48,
    letterSpacing: -1.65,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 20,
    marginBottom: 52,
    color: '#737987',
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: -0.42,
    fontWeight: '400',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    borderRadius: 40,
    paddingHorizontal: 31,
    paddingTop: 34,
    paddingBottom: 26,
    backgroundColor: 'rgba(255,255,255,0.56)',
    borderWidth: 1.35,
    borderColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 26 },
    elevation: 10,
  },
  label: {
    color: '#151922',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.24,
  },
  passwordLabel: {
    marginTop: 28,
  },
  input: {
    height: 64,
    marginTop: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.15,
    borderColor: 'rgba(255,255,255,0.98)',
    color: '#151922',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.3,
    shadowColor: '#111827',
    shadowOpacity: 0.025,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  passwordInputWrap: {
    height: 64,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.15,
    borderColor: 'rgba(255,255,255,0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.025,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 20,
    paddingRight: 12,
    color: '#151922',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  eyeButton: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
    marginBottom: 24,
  },
  forgotText: {
    color: '#747985',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
  continueButton: {
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  magicButton: {
    height: 64,
    marginTop: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1.15,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 19,
    shadowOffset: { width: 0, height: 11 },
    elevation: 4,
  },
  magicText: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  backRow: {
    marginTop: 24,
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  backLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(17,24,39,0.08)',
  },
  backText: {
    color: '#747985',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.995 }],
  },
});
