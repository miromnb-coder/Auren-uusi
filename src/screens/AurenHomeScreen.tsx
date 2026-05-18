import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AurenComposer } from '../components/AurenComposer';
import { AurenHeader } from '../components/AurenHeader';
import { AurenQuickActions } from '../components/AurenQuickActions';
import { colors } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export function AurenHomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <AurenHeader />

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{'Good evening,\nlet’s study smarter.'}</Text>
          <Text style={styles.heroSubtitle}>{'I’m here to help you focus, learn faster,\nand stay on track.'}</Text>
        </View>

        <AurenQuickActions />
      </View>

      <View style={styles.composerWrap}>
        <AurenComposer />
      </View>
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 74,
    paddingBottom: 210,
  },
  hero: {
    alignItems: 'center',
    maxWidth: 370,
  },
  heroTitle: {
    color: '#686775',
    fontSize: 33.5,
    lineHeight: 40,
    letterSpacing: -1.08,
    textAlign: 'center',
    fontFamily: serifFont,
  },
  heroSubtitle: {
    marginTop: 15,
    color: colors.muted,
    fontSize: 15.8,
    lineHeight: 22.5,
    letterSpacing: -0.14,
    textAlign: 'center',
    fontWeight: '500',
  },
  composerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 38,
  },
});
