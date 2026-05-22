import { ChevronLeft, Folder, Plus } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type AurenProjectsScreenProps = {
  onBack: () => void;
  onCreateProject?: () => void;
};

export function AurenProjectsScreen({ onBack, onCreateProject }: AurenProjectsScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <ChevronLeft size={31} color={colors.text} strokeWidth={2.05} />
        </Pressable>

        <Text style={styles.headerTitle}>Projects</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create project"
          onPress={onCreateProject}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Plus size={32} color={colors.text} strokeWidth={2.05} />
        </Pressable>
      </View>

      <View style={styles.emptyWrap}>
        <View style={styles.iconWrap}>
          <Folder size={72} color="rgba(104,103,117,0.72)" strokeWidth={1.75} />
        </View>

        <Text style={styles.emptyTitle}>{'Organize your chats, files,\nand study materials in one place'}</Text>

        <Text style={styles.emptySubtitle}>{'Everything related to a project\nstays together here.'}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create project"
          onPress={onCreateProject}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
        >
          <Text style={styles.primaryButtonText}>Create project</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 104,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.035)',
    ...shadows.tiny,
  },
  headerTitle: {
    position: 'absolute',
    left: 110,
    right: 110,
    textAlign: 'center',
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '700',
    letterSpacing: -0.42,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 118,
  },
  iconWrap: {
    marginBottom: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    maxWidth: 360,
    color: '#686775',
    fontFamily: serifFont,
    fontSize: 35,
    lineHeight: 43,
    fontWeight: '700',
    letterSpacing: -1.1,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 24,
    maxWidth: 320,
    color: colors.muted,
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '500',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 64,
    minWidth: 252,
    height: 68,
    paddingHorizontal: 35,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1a18',
    shadowColor: '#111827',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 20.5,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.28,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
  },
  primaryPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
