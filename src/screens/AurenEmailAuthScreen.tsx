import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

type AurenEmailAuthScreenProps = {
  onBack: () => void;
  onContinue?: () => void;
};

type AuthNotice = {
  tone: 'error' | 'success' | 'neutral';
  message: string;
} | null;

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Something went wrong. Please try again.');
  const normalized = message.toLowerCase();

  if (normalized.includes('network request failed') || normalized.includes('failed to fetch')) {
    return 'Cannot reach Auren Cloud. Check your connection and try again.';
  }

  if (normalized.includes('rate')) {
    return 'Too many attempts. Wait a moment and try again.';
  }

  return message;
}

export function AurenEmailAuthScreen({ onBack, onContinue }: AurenEmailAuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notice, setNotice] = useState<AuthNotice>(null);
  const [pendingAction, setPendingAction] = useState<'continue' | 'magic' | null>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const cleanEmail = email.trim().toLowerCase();
  const isBusy = pendingAction !== null;

  const clearError = () => {
    if (notice?.tone === 'error') {
      setNotice(null);
    }
  };

  const validateEmail = () => {
    if (!isValidEmail(cleanEmail)) {
      setNotice({ tone: 'error', message: 'Enter a valid email address.' });
      return false;
    }

    return true;
  };

  const continueWithEmail = async () => {
    if (isBusy || !validateEmail()) {
      return;
    }

    if (password.length < 6) {
      setNotice({ tone: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    Keyboard.dismiss();
    setPendingAction('continue');
    setNotice({ tone: 'neutral', message: 'Signing in or creating your account...' });

    try {
      const credentials = { email: cleanEmail, password };
      const signInResult = await supabase.auth.signInWithPassword(credentials);

      if (!signInResult.error) {
        setNotice({ tone: 'success', message: 'Signed in. Opening Auren...' });
        onContinue?.();
        return;
      }

      const shouldTryCreateAccount = signInResult.error.message.toLowerCase().includes('invalid login credentials');

      if (!shouldTryCreateAccount) {
        throw signInResult.error;
      }

      const signUpResult = await supabase.auth.signUp({
        ...credentials,
        options: {
          data: {
            app_name: 'Auren',
          },
        },
      });

      if (signUpResult.error) {
        throw signUpResult.error;
      }

      if (signUpResult.data.session) {
        setNotice({ tone: 'success', message: 'Account created. Opening Auren...' });
        onContinue?.();
      } else {
        setNotice({ tone: 'success', message: 'Account created. Check your email to confirm it, then log in.' });
      }
    } catch (error) {
      setNotice({ tone: 'error', message: getAuthErrorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  };

  const sendMagicLink = async () => {
    if (isBusy || !validateEmail()) {
      return;
    }

    Keyboard.dismiss();
    setPendingAction('magic');
    setNotice({ tone: 'neutral', message: 'Sending magic link...' });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      setNotice({ tone: 'success', message: 'Magic link sent. Check your email to continue.' });
    } catch (error) {
      setNotice({ tone: 'error', message: getAuthErrorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    onBack();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                onChangeText={(value) => {
                  setEmail(value);
                  clearError();
                }}
                placeholder="you@example.com"
                placeholderTextColor="#858995"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isBusy}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                style={styles.input}
              />

              <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  ref={passwordInputRef}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError();
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#858995"
                  secureTextEntry={!passwordVisible}
                  textContentType="password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isBusy}
                  returnKeyType="done"
                  onSubmitEditing={continueWithEmail}
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setPasswordVisible((current) => !current)}
                  hitSlop={12}
                  disabled={isBusy}
                  style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                >
                  <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={28} color="#717784" />
                </Pressable>
              </View>

              <Pressable onPress={Keyboard.dismiss} style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              {notice ? <Text style={[styles.noticeText, styles[notice.tone]]}>{notice.message}</Text> : null}

              <Pressable
                onPress={continueWithEmail}
                disabled={isBusy}
                style={({ pressed }) => [styles.continueButton, pressed && styles.pressed, isBusy && styles.disabled]}
              >
                <Text style={styles.continueText}>{pendingAction === 'continue' ? 'Please wait...' : 'Continue'}</Text>
              </Pressable>

              <Pressable
                onPress={sendMagicLink}
                disabled={isBusy}
                style={({ pressed }) => [styles.magicButton, pressed && styles.pressed, isBusy && styles.disabled]}
              >
                <Text style={styles.magicText}>{pendingAction === 'magic' ? 'Sending...' : 'Send magic link'}</Text>
              </Pressable>

              <Pressable onPress={goBack} disabled={isBusy} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
                <View style={styles.backLine} />
                <Text style={styles.backText}>Back to sign in</Text>
                <View style={styles.backLine} />
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7f8',
  },
  keyboardView: {
    flex: 1,
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
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#111827',
    shadowOpacity: 0.07,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 20 },
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
    marginTop: 21,
  },
  input: {
    height: 54,
    marginTop: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
    color: '#151922',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.26,
    shadowColor: '#111827',
    shadowOpacity: 0.022,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  passwordInputWrap: {
    height: 54,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.022,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
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
    marginBottom: 10,
  },
  forgotText: {
    color: '#747985',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  noticeText: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.12,
  },
  error: {
    color: '#9f3434',
  },
  success: {
    color: '#35664d',
  },
  neutral: {
    color: '#747985',
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 15,
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
  disabled: {
    opacity: 0.62,
  },
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.995 }],
  },
});
