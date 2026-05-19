import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/lib/supabase';
import { AurenEmailAuthScreen } from './src/screens/AurenEmailAuthScreen';
import { AurenHomeScreen } from './src/screens/AurenHomeScreen';
import { AurenWelcomeScreen } from './src/screens/AurenWelcomeScreen';
import { colors } from './src/theme';

type AuthView = 'welcome' | 'email';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('welcome');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          {isAuthLoading ? (
            <View style={styles.loadingScreen}>
              <ActivityIndicator color="#151922" />
            </View>
          ) : session ? (
            <AurenHomeScreen />
          ) : authView === 'email' ? (
            <AurenEmailAuthScreen onBack={() => setAuthView('welcome')} />
          ) : (
            <AurenWelcomeScreen onContinue={() => setAuthView('email')} onEmailContinue={() => setAuthView('email')} />
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7f8',
  },
});
