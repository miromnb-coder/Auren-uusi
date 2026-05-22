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
          <ChevronLeft size={28} color={colors.text} strokeWidth={2.05} />
        </Pressable>

        <Text style={styles.headerTitle}>Projects</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create project"
          onPress={onCreateProject}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Plus size={29} color={colors.text} strokeWidth={2.05} />
        </Pressable>
      </View>

      <View style={styles.emptyWrap}>
        <View style={styles.iconWrap}>
          <Folder size={59} color="rgba(104,103,117,0.74)" strokeWidth={1.72} />
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
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
    ...shadows.tiny,
  },
  headerTitle: {
    position: 'absolute',
    left: 110,
    right: 110,
    textAlign: 'center',
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '600',
    letterSpacing: -0.36,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 6,
  },
  iconWrap: {
    marginBottom: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    maxWidth: 350,
    color: '#686775',
    fontFamily: serifFont,
    fontSize: 28.5,
    lineHeight: 36,
    fontWeight: '400',
    letterSpacing: -0.78,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 24,
    maxWidth: 300,
    color: colors.muted,
    fontSize: 17.5,
    lineHeight: 25.5,
    fontWeight: '500',
    letterSpacing: -0.18,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 58,
    minWidth: 190,
    height: 54,
    paddingHorizontal: 30,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1a18',
    shadowColor: '#111827',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    elevation: 7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17.4,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.18,
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
