import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AurenComposer } from '../components/AurenComposer';
import { AurenHeader } from '../components/AurenHeader';
import { AurenQuickActions } from '../components/AurenQuickActions';
import { colors, spacing } from '../theme';

export function AurenHomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <AurenHeader />

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Your next study move is ready.</Text>
          <Text style={styles.heroMeta}>Today · Math · 25 min focus</Text>
        </View>

        <AurenQuickActions />
      </View>

      <AurenComposer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    justifyContent: 'flex-end',
    paddingBottom: 64,
    gap: 88,
  },
  hero: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '500',
    letterSpacing: -0.35,
  },
  heroMeta: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 16,
  },
});
