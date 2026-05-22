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
          <ChevronLeft size={25} color={colors.text} strokeWidth={1.95} />
        </Pressable>

        <Text style={styles.headerTitle}>Projects</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create project"
          onPress={onCreateProject}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Plus size={28} color={colors.text} strokeWidth={1.95} />
        </Pressable>
      </View>

      <View style={styles.emptyWrap}>
        <View style={styles.iconWrap}>
          <Folder size={54} color="rgba(104,103,117,0.74)" strokeWidth={1.55} />
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
    height: 94,
    paddingHorizontal: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.03)',
    ...shadows.tiny,
  },
  headerTitle: {
    position: 'absolute',
    left: 110,
    right: 110,
    textAlign: 'center',
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 226,
    paddingHorizontal: 30,
  },
  iconWrap: {
    marginBottom: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    maxWidth: 340,
    color: '#686775',
    fontFamily: serifFont,
    fontSize: 24.5,
    lineHeight: 31.5,
    fontWeight: '400',
    letterSpacing: -0.66,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 25,
    maxWidth: 294,
    color: colors.muted,
    fontSize: 16.2,
    lineHeight: 23.5,
    fontWeight: '500',
    letterSpacing: -0.16,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 47,
    minWidth: 178,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1a18',
    shadowColor: '#111827',
    shadowOpacity: 0.13,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16.4,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.16,
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
