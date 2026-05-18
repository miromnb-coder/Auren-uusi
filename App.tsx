import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AurenEmailAuthScreen } from './src/screens/AurenEmailAuthScreen';
import { AurenHomeScreen } from './src/screens/AurenHomeScreen';
import { AurenWelcomeScreen } from './src/screens/AurenWelcomeScreen';
import { colors } from './src/theme';

type AuthView = 'welcome' | 'email';

export default function App() {
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('welcome');

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          {hasEnteredApp ? (
            <AurenHomeScreen />
          ) : authView === 'email' ? (
            <AurenEmailAuthScreen
              onBack={() => setAuthView('welcome')}
              onContinue={() => setHasEnteredApp(true)}
            />
          ) : (
            <AurenWelcomeScreen
              onContinue={() => setHasEnteredApp(true)}
              onEmailContinue={() => setAuthView('email')}
            />
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
