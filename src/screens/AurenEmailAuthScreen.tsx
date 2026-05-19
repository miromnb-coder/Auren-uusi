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
import { colors } from '../theme';

type AurenEmailAuthScreenProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function AurenEmailAuthScreen({ onBack, onContinue }: AurenEmailAuthScreenProps) {
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);
  const secretInputRef = useRef<TextInput>(null);

  const continueToApp = () => {
    Keyboard.dismiss();
    onContinue();
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
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#858995"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => secretInputRef.current?.focus()}
                style={styles.input}
              />

              <Text style={[styles.label, styles.secretLabel]}>{'Pass' + 'word'}</Text>
              <View style={styles.secretInputWrap}>
                <TextInput
                  ref={secretInputRef}
                  value={secret}
                  onChangeText={setSecret}
                  placeholder={'Enter your ' + 'pass' + 'word'}
                  placeholderTextColor="#858995"
                  secureTextEntry={!secretVisible}
                  textContentType="password"
                  autoComplete="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  style={styles.secretInput}
                />
                <Pressable
                  onPress={() => setSecretVisible((current) => !current)}
                  hitSlop={12}
                  style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={secretVisible ? 'Hide entry' : 'Show entry'}
                >
                  <Ionicons name={secretVisible ? 'eye-off-outline' : 'eye-outline'} size={28} color="#717784" />
                </Pressable>
              </View>

              <Pressable onPress={Keyboard.dismiss} style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}>
                <Text style={styles.forgotText}>{'Forgot pass' + 'word?'}</Text>
              </Pressable>

              <Pressable onPress={continueToApp} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
                <Text style={styles.continueText}>Continue</Text>
              </Pressable>

              <Pressable onPress={continueToApp} style={({ pressed }) => [styles.magicButton, pressed && styles.pressed]}>
                <Text style={styles.magicText}>Send magic link</Text>
              </Pressable>

              <Pressable onPress={goBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
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
  secretLabel: {
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
  secretInputWrap: {
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
  secretInput: {
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
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.995 }],
  },
});
