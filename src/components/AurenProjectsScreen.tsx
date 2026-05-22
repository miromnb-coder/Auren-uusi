import { ChevronLeft, FileText, Folder, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type CreateProjectPayload = {
  title: string;
  description: string | null;
};

type AurenProjectsScreenProps = {
  onBack: () => void;
  createSheetVisible: boolean;
  createProjectSubmitting?: boolean;
  createProjectError?: string | null;
  onOpenCreateProject: () => void;
  onCloseCreateProject: () => void;
  onSubmitCreateProject: (payload: CreateProjectPayload) => void;
};

export function AurenProjectsScreen({
  onBack,
  createSheetVisible,
  createProjectSubmitting = false,
  createProjectError = null,
  onOpenCreateProject,
  onCloseCreateProject,
  onSubmitCreateProject,
}: AurenProjectsScreenProps) {
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
          onPress={onOpenCreateProject}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Plus size={28} color={colors.text} strokeWidth={1.95} />
        </Pressable>
      </View>

      <View style={styles.emptyWrap}>
        <View style={styles.iconWrap}>
          <Folder size={53} color="rgba(104,103,117,0.72)" strokeWidth={1.52} />
        </View>

        <Text style={styles.emptyTitle}>{'Organize your chats, files,\nand study materials in one place'}</Text>

        <Text style={styles.emptySubtitle}>{'Everything related to a project\nstays together here.'}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create project"
          onPress={onOpenCreateProject}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
        >
          <Text style={styles.primaryButtonText}>Create project</Text>
        </Pressable>
      </View>

      <CreateProjectSheet
        visible={createSheetVisible}
        submitting={createProjectSubmitting}
        error={createProjectError}
        onClose={onCloseCreateProject}
        onSubmit={onSubmitCreateProject}
      />
    </SafeAreaView>
  );
}

type CreateProjectSheetProps = {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => void;
};

function CreateProjectSheet({ visible, submitting, error, onClose, onSubmit }: CreateProjectSheetProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [mounted, setMounted] = useState(visible);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const canSubmit = projectName.trim().length > 0 && !submitting;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setProjectName('');
      setDescription('');
    }

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
      }
    });
  }, [progress, visible]);

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.46],
  });

  const sheetTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [720, 0],
  });

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit) return;

    Keyboard.dismiss();
    onSubmit({
      title: projectName.trim(),
      description: description.trim() || null,
    });
  }

  if (!mounted) return null;

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.sheetRoot}>
      <Animated.View style={[styles.sheetOverlay, { opacity: overlayOpacity }]}> 
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <Animated.View
          onStartShouldSetResponderCapture={() => {
            Keyboard.dismiss();
            return false;
          }}
          style={[
            styles.createSheet,
            {
              paddingBottom: Math.max(insets.bottom + 14, 34),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Create project</Text>
          <Text style={styles.sheetSubtitle}>Organize chats, files, and study materials in one place.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Project name</Text>
            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g., Biology 101"
              placeholderTextColor="rgba(104,103,117,0.42)"
              autoCapitalize="sentences"
              autoCorrect
              style={styles.input}
            />

            <Text style={[styles.label, styles.descriptionLabel]}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a short description..."
              placeholderTextColor="rgba(104,103,117,0.42)"
              autoCapitalize="sentences"
              autoCorrect
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.descriptionInput]}
            />

            <View style={styles.hintRow}>
              <FileText size={22} color="rgba(104,103,117,0.78)" strokeWidth={1.8} />
              <Text style={styles.hintText}>Add first note or file later</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={handleClose}
              disabled={submitting}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, submitting && styles.disabled]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create project"
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.createButton,
                pressed && canSubmit && styles.primaryPressed,
                !canSubmit && styles.createButtonDisabled,
              ]}
            >
              <Text style={styles.createButtonText}>{submitting ? 'Creating...' : 'Create project'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
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
    paddingTop: 150,
    paddingHorizontal: 30,
  },
  iconWrap: {
    marginBottom: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    maxWidth: 340,
    color: '#686775',
    fontFamily: serifFont,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '400',
    letterSpacing: -0.64,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 24,
    maxWidth: 292,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23.2,
    fontWeight: '500',
    letterSpacing: -0.16,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 45,
    minWidth: 176,
    height: 49,
    paddingHorizontal: 28,
    borderRadius: 24.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1a18',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16.2,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.16,
  },
  sheetRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
  },
  keyboardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  createSheet: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 34,
    backgroundColor: '#fffefb',
    shadowColor: '#111827',
    shadowOpacity: 0.14,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -14 },
    elevation: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 58,
    height: 7,
    borderRadius: 999,
    marginBottom: 31,
    backgroundColor: 'rgba(104,103,117,0.28)',
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '400',
    letterSpacing: -0.74,
    textAlign: 'center',
  },
  sheetSubtitle: {
    marginTop: 14,
    color: '#686775',
    fontSize: 15.8,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.14,
    textAlign: 'center',
  },
  form: {
    marginTop: 32,
  },
  label: {
    color: colors.text,
    fontSize: 15.7,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.15,
    marginBottom: 10,
  },
  descriptionLabel: {
    marginTop: 24,
  },
  input: {
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 18,
    color: colors.text,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.16,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.26)',
  },
  descriptionInput: {
    minHeight: 66,
    paddingTop: 17,
    paddingBottom: 14,
  },
  hintRow: {
    minHeight: 48,
    marginTop: 24,
    borderRadius: 999,
    paddingHorizontal: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.13)',
  },
  hintText: {
    flex: 1,
    color: '#686775',
    fontSize: 15.8,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.12,
  },
  errorText: {
    marginTop: 13,
    color: '#9f2f2f',
    fontSize: 13.8,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  actionsRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  cancelButton: {
    flex: 0.84,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.07)',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16.5,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.13,
  },
  createButton: {
    flex: 1.18,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1a18',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  createButtonDisabled: {
    opacity: 0.38,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 17.4,
    lineHeight: 22,
    fontWeight: '600',
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
  disabled: {
    opacity: 0.52,
  },
});
