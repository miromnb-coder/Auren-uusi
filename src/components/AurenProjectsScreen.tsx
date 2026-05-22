import { Check, ChevronLeft, Folder, MoreHorizontal, PencilLine, Plus, Trash2, Upload, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AurenProject } from '../lib/aurenConversations';
import { colors, shadows } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type CreateProjectPayload = {
  title: string;
  description: string | null;
};

type AurenProjectsScreenProps = {
  onBack: () => void;
  projects?: AurenProject[];
  loadingProjects?: boolean;
  createSheetVisible: boolean;
  createProjectSubmitting?: boolean;
  createProjectError?: string | null;
  onOpenCreateProject: () => void;
  onCloseCreateProject: () => void;
  onSubmitCreateProject: (payload: CreateProjectPayload) => void;
  onRenameProject?: (project: AurenProject) => void;
  onDeleteProject?: (project: AurenProject) => void;
};

function formatProjectDate(value: string | null) {
  if (!value) return 'Tänään';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tänään';

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) return 'Tänään';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return 'Eilen';

  return new Intl.DateTimeFormat('fi-FI', { day: 'numeric', month: 'long' }).format(date);
}

export function AurenProjectsScreen({
  onBack,
  projects = [],
  loadingProjects = false,
  createSheetVisible,
  createProjectSubmitting = false,
  createProjectError = null,
  onOpenCreateProject,
  onCloseCreateProject,
  onSubmitCreateProject,
  onRenameProject,
  onDeleteProject,
}: AurenProjectsScreenProps) {
  const [actionProject, setActionProject] = useState<AurenProject | null>(null);
  const hasProjects = projects.length > 0;

  function closeActions() {
    setActionProject(null);
  }

  function handleRenameProject() {
    if (!actionProject) return;
    onRenameProject?.(actionProject);
    closeActions();
  }

  function handleDeleteProject() {
    if (!actionProject) return;
    onDeleteProject?.(actionProject);
    closeActions();
  }

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

      {hasProjects ? (
        <ScrollView
          style={styles.projectScroll}
          contentContainerStyle={styles.projectList}
          showsVerticalScrollIndicator={false}
        >
          {projects.map((project) => (
            <Pressable
              key={project.id}
              accessibilityRole="button"
              accessibilityLabel={project.title}
              style={({ pressed }) => [styles.projectRow, pressed && styles.projectRowPressed]}
            >
              <View style={styles.projectIconSlot}>
                <Folder size={30} color={colors.text} strokeWidth={1.82} />
              </View>

              <View style={styles.projectTextWrap}>
                <Text style={styles.projectTitle} numberOfLines={1}>
                  {project.title}
                </Text>
                <Text style={styles.projectSubtitle}>{formatProjectDate(project.lastOpenedAt ?? project.updatedAt)}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Project actions for ${project.title}`}
                hitSlop={12}
                onPress={() => setActionProject(project)}
                style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
              >
                <MoreHorizontal size={24} color="rgba(34,27,23,0.72)" strokeWidth={2.25} />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyWrap}>
          <View style={styles.iconWrap}>
            <Folder size={53} color="rgba(104,103,117,0.72)" strokeWidth={1.52} />
          </View>

          <Text style={styles.emptyTitle}>{'Keep your chats, files,\nand study resources in one place'}</Text>

          <Text style={styles.emptySubtitle}>
            {loadingProjects ? 'Loading your projects...' : 'Everything for a project\nstays organized here.'}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create project"
            onPress={onOpenCreateProject}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
          >
            <Text style={styles.primaryButtonText}>Create project</Text>
          </Pressable>
        </View>
      )}

      <ProjectActionsSheet
        visible={Boolean(actionProject)}
        onClose={closeActions}
        onRename={handleRenameProject}
        onDelete={handleDeleteProject}
      />

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

type ProjectActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
};

function ProjectActionsSheet({ visible, onClose, onRename, onDelete }: ProjectActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 230 : 185,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [progress, visible]);

  const overlayOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] });
  const sheetTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [330, 0] });

  if (!mounted) return null;

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.actionsRoot}>
      <Animated.View style={[styles.actionsOverlay, { opacity: overlayOpacity }]}> 
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.actionsSheet,
          {
            paddingBottom: Math.max(insets.bottom + 18, 34),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.actionsHandle} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rename project"
          onPress={onRename}
          style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
        >
          <PencilLine size={25} color={colors.text} strokeWidth={1.82} />
          <Text style={styles.actionText}>Nimeä uudelleen</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete project"
          onPress={onDelete}
          style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}
        >
          <Trash2 size={25} color="#a62935" strokeWidth={1.82} />
          <Text style={styles.deleteText}>Poista</Text>
        </Pressable>
      </Animated.View>
    </View>
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
  const keyboardLift = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [projectName, setProjectName] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const canSubmit = projectName.trim().length > 0 && !submitting;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setProjectName('');
      keyboardLift.setValue(0);
    }

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        setInputFocused(false);
        keyboardLift.setValue(0);
      }
    });
  }, [keyboardLift, progress, visible]);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const keyboardHeight = event.endCoordinates.height;
      const nextLift = Math.max(0, keyboardHeight - insets.bottom - 8);

      Animated.timing(keyboardLift, {
        toValue: nextLift,
        duration: event.duration ?? 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: event.duration ?? 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setInputFocused(false));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, keyboardLift, mounted]);

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.47],
  });

  const sheetTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [720, 0],
  });

  const keyboardTranslateY = Animated.multiply(keyboardLift, -1);
  const combinedTranslateY = Animated.add(sheetTranslateY, keyboardTranslateY);

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit) return;

    Keyboard.dismiss();
    onSubmit({
      title: projectName.trim(),
      description: null,
    });
  }

  if (!mounted) return null;

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.sheetRoot}>
      <Animated.View style={[styles.sheetOverlay, { opacity: overlayOpacity }]}> 
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <View pointerEvents="box-none" style={styles.keyboardWrap}>
        <Animated.View
          onStartShouldSetResponderCapture={() => {
            Keyboard.dismiss();
            return false;
          }}
          style={[
            styles.createSheet,
            {
              paddingBottom: Math.max(insets.bottom + 26, 42),
              transform: [{ translateY: combinedTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel project creation"
              onPress={handleClose}
              disabled={submitting}
              style={({ pressed }) => [styles.sheetIconButton, pressed && styles.pressed, submitting && styles.disabled]}
            >
              <X size={25} color={colors.text} strokeWidth={1.9} />
            </Pressable>

            <Text style={styles.sheetTitle}>New project</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create project"
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.sheetIconButton,
                pressed && canSubmit && styles.pressed,
                !canSubmit && styles.confirmButtonDisabled,
              ]}
            >
              <Check size={24} color={colors.text} strokeWidth={1.9} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Project title"
              placeholderTextColor="rgba(104,103,117,0.42)"
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="done"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={handleSubmit}
              style={[styles.input, inputFocused && styles.inputFocused]}
            />

            <Text style={styles.materialsTitle}>Add resources</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload files"
              style={({ pressed }) => [styles.uploadBox, pressed && styles.pressed]}
            >
              <Upload size={30} color={colors.text} strokeWidth={1.55} />
              <Text style={styles.uploadText}>Upload files</Text>
            </Pressable>

            <Text style={styles.helperText}>
              Add notes, PDFs, or images to help Auren understand this project and give better support.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </Animated.View>
      </View>
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
  projectScroll: {
    flex: 1,
  },
  projectList: {
    paddingTop: 22,
    paddingHorizontal: 35,
    paddingBottom: 90,
  },
  projectRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectRowPressed: {
    opacity: 0.74,
  },
  projectIconSlot: {
    width: 52,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  projectTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  projectTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '500',
    letterSpacing: -0.28,
  },
  projectSubtitle: {
    marginTop: 1,
    color: colors.muted,
    fontSize: 15.8,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.14,
  },
  moreButton: {
    width: 42,
    height: 42,
    marginLeft: 8,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 348,
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
  actionsRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 82,
  },
  actionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
  },
  actionsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 235,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 31,
    backgroundColor: '#fffefb',
    shadowColor: '#111827',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -12 },
    elevation: 16,
  },
  actionsHandle: {
    alignSelf: 'center',
    width: 49,
    height: 7,
    borderRadius: 999,
    marginBottom: 28,
    backgroundColor: 'rgba(104,103,117,0.34)',
  },
  actionRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  actionPressed: {
    opacity: 0.58,
  },
  actionText: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  deleteText: {
    color: '#a62935',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.22,
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
    borderTopLeftRadius: 31,
    borderTopRightRadius: 31,
    paddingTop: 28,
    paddingHorizontal: 30,
    backgroundColor: '#fffefb',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -14 },
    elevation: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 6,
    borderRadius: 999,
    marginBottom: 26,
    backgroundColor: 'rgba(104,103,117,0.22)',
  },
  sheetHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetIconButton: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,241,237,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.035)',
  },
  sheetTitle: {
    position: 'absolute',
    left: 70,
    right: 70,
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400',
    letterSpacing: -0.42,
    textAlign: 'center',
  },
  form: {
    marginTop: 34,
  },
  input: {
    minHeight: 67,
    borderRadius: 18,
    paddingHorizontal: 23,
    color: colors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.22,
    backgroundColor: 'rgba(250,249,247,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.15)',
  },
  inputFocused: {
    borderColor: 'rgba(104,103,117,0.34)',
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  materialsTitle: {
    marginTop: 31,
    marginBottom: 18,
    color: colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  uploadBox: {
    minHeight: 107,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: 'rgba(250,249,247,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.14)',
  },
  uploadText: {
    color: colors.text,
    fontSize: 17.5,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.16,
  },
  helperText: {
    marginTop: 25,
    color: colors.muted,
    fontSize: 15.8,
    lineHeight: 22.7,
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
  confirmButtonDisabled: {
    opacity: 0.42,
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
