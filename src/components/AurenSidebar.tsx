import { Calendar, Circle, CirclePlus, Diamond, PlayCircle, Search, Settings, Sparkles, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AurenProfileSheet } from './AurenProfileSheet';
import type { AurenConversation, AurenProject } from '../lib/aurenConversations';
import { aurenHaptics } from '../lib/aurenHaptics';
import { colors } from '../theme';

type ActiveSidebarItem = 'newChat' | 'projects' | null;

type AurenSidebarProps = {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  onOpen?: () => void;
  onNewChat?: () => void;
  onSearchChats?: () => void;
  onProjects?: () => void;
  onNewProject?: () => void;
  gesturesEnabled?: boolean;
  gestureBottomExclusion?: number;
  conversations?: AurenConversation[];
  projects?: AurenProject[];
  activeConversationId?: string | null;
  activeProjectId?: string | null;
  activeItem?: ActiveSidebarItem;
  profileName?: string;
  avatarLetter?: string;
  loadingConversations?: boolean;
  loadingProjects?: boolean;
  onSelectConversation?: (conversationId: string) => void;
  onSelectProject?: (project: AurenProject) => void;
  onRenameConversation?: (conversation: AurenConversation, title: string) => Promise<void> | void;
  onDeleteConversation?: (conversation: AurenConversation) => Promise<void> | void;
};

const DRAWER_BACKGROUND = colors.background;
const SIDEBAR_ICON_COLOR = 'rgba(15,17,21,0.88)';
const ICON_STROKE_WIDTH = 1.78;
const DRAG_ACTIVATION_DISTANCE = 8;
const HORIZONTAL_DOMINANCE = 1.18;
const SWIPE_VELOCITY = 720;
const OPEN_PROGRESS_THRESHOLD = 0.38;
const CLOSE_PROGRESS_THRESHOLD = 0.62;
const SIDEBAR_PROJECT_LIMIT = 4;
const MAIN_CARD_OPEN_TRANSLATE = 0.62;
const MAIN_CARD_OPEN_RADIUS = 38;
const MAIN_CARD_OPEN_SCALE = 0.985;
const DRAWER_PARALLAX_OFFSET = 24;

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function clampProgress(value: number) {
  'worklet';
  return Math.min(Math.max(value, 0), 1);
}

function IconSlot({ children }: { children: ReactNode }) {
  return <View style={styles.iconSlot}>{children}</View>;
}

function SpaceIcon({ project, index, active }: { project: AurenProject; index: number; active: boolean }) {
  const normalizedTitle = project.title.trim().toLowerCase();
  const iconProps = { size: 24, color: SIDEBAR_ICON_COLOR, strokeWidth: ICON_STROKE_WIDTH };

  if (active || normalizedTitle.includes('opiskelu')) return <Sparkles {...iconProps} />;
  if (normalizedTitle.includes('biology') || index === 0) return <Circle {...iconProps} />;
  if (normalizedTitle.includes('writing') || index === 1) return <Diamond {...iconProps} />;

  return <Text style={styles.waveIcon}>⌁</Text>;
}

export function AurenSidebar({
  open,
  children,
  onClose,
  onOpen,
  onNewChat,
  onSearchChats,
  onNewProject,
  gesturesEnabled = true,
  gestureBottomExclusion = 0,
  conversations = [],
  projects = [],
  activeConversationId = null,
  activeProjectId = null,
  profileName = 'Auren user',
  avatarLetter = 'A',
  loadingConversations = false,
  loadingProjects = false,
  onSelectConversation,
  onSelectProject,
}: AurenSidebarProps) {
  const { width, height } = useWindowDimensions();
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const drawerProgress = useSharedValue(open ? 1 : 0);
  const openValue = useSharedValue(open ? 1 : 0);
  const rootGestureStartProgress = useSharedValue(open ? 1 : 0);
  const rootGestureEligible = useSharedValue(0);
  const drawerCloseGestureStartProgress = useSharedValue(1);

  const drawerWidth = useMemo(() => width, [width]);
  const visibleProjects = useMemo(() => projects.slice(0, SIDEBAR_PROJECT_LIMIT), [projects]);
  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) ?? null, [activeProjectId, projects]);
  const preferredContinueProject = useMemo(
    () => activeProject ?? projects.find((project) => project.title.trim().toLowerCase().includes('opiskelu')) ?? visibleProjects[0] ?? null,
    [activeProject, projects, visibleProjects],
  );
  const continueProjectTitle = preferredContinueProject?.title ?? 'Opiskelu';
  const normalizedGestureBottomExclusion = Math.max(0, gestureBottomExclusion);

  useEffect(() => {
    openValue.value = open ? 1 : 0;
    drawerProgress.value = withTiming(open ? 1 : 0, {
      duration: open ? 330 : 255,
      easing: Easing.out(Easing.cubic),
    });
  }, [drawerProgress, open, openValue]);

  useEffect(() => {
    if (!open && profileSheetOpen) setProfileSheetOpen(false);
  }, [open, profileSheetOpen]);

  function openSearchChats() {
    void aurenHaptics.selection();
    onSearchChats?.();
  }

  function openAskAuren() {
    void aurenHaptics.selection();
    onNewChat?.();
  }

  function openNewProject() {
    void aurenHaptics.selection();
    onNewProject?.();
  }

  function openSidebarProject(project: AurenProject) {
    void aurenHaptics.selection();
    onSelectProject?.(project);
  }

  function openContinueProject() {
    if (!preferredContinueProject) return;
    openSidebarProject(preferredContinueProject);
  }

  function openProfileSheet() {
    void aurenHaptics.panelOpen();
    setProfileSheetOpen(true);
  }

  function closeProfileSheet() {
    void aurenHaptics.panelClose();
    setProfileSheetOpen(false);
  }

  const rootGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(gesturesEnabled && !profileSheetOpen)
        .activeOffsetX([-DRAG_ACTIVATION_DISTANCE, DRAG_ACTIVATION_DISTANCE])
        .failOffsetY([-28, 28])
        .onBegin((event) => {
          const startsAboveComposer = event.absoluteY < height - normalizedGestureBottomExclusion;
          rootGestureStartProgress.value = drawerProgress.value;
          rootGestureEligible.value = startsAboveComposer || openValue.value > 0.01 ? 1 : 0;
        })
        .onUpdate((event) => {
          if (!rootGestureEligible.value) return;
          const isMostlyHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY) * HORIZONTAL_DOMINANCE;
          if (!isMostlyHorizontal) return;
          if (openValue.value < 0.01 && event.translationX < 0) return;
          if (openValue.value > 0.01 && event.translationX > 0) return;
          drawerProgress.value = clampProgress(rootGestureStartProgress.value + event.translationX / (drawerWidth * MAIN_CARD_OPEN_TRANSLATE));
        })
        .onEnd((event) => {
          if (!rootGestureEligible.value) return;
          const shouldOpen = event.velocityX > SWIPE_VELOCITY || (event.velocityX > -SWIPE_VELOCITY && drawerProgress.value > OPEN_PROGRESS_THRESHOLD);
          const shouldClose = event.velocityX < -SWIPE_VELOCITY || (event.velocityX < SWIPE_VELOCITY && drawerProgress.value < CLOSE_PROGRESS_THRESHOLD);
          const nextOpen = openValue.value > 0.01 ? !shouldClose : shouldOpen;
          drawerProgress.value = withTiming(
            nextOpen ? 1 : 0,
            { duration: nextOpen ? 235 : 205, easing: Easing.out(Easing.cubic) },
            (finished) => {
              if (!finished) return;
              if (nextOpen) {
                if (onOpen) runOnJS(onOpen)();
              } else {
                runOnJS(onClose)();
              }
            },
          );
        })
        .onFinalize(() => {
          rootGestureEligible.value = 0;
        }),
    [drawerProgress, drawerWidth, gesturesEnabled, height, normalizedGestureBottomExclusion, onClose, onOpen, openValue, profileSheetOpen, rootGestureEligible, rootGestureStartProgress],
  );

  const drawerCloseGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(gesturesEnabled && open && !profileSheetOpen)
        .activeOffsetX([-DRAG_ACTIVATION_DISTANCE, DRAG_ACTIVATION_DISTANCE])
        .failOffsetY([-28, 28])
        .onBegin(() => {
          drawerCloseGestureStartProgress.value = drawerProgress.value;
        })
        .onUpdate((event) => {
          const isMostlyHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY) * HORIZONTAL_DOMINANCE;
          if (!isMostlyHorizontal || event.translationX >= 0) return;
          drawerProgress.value = clampProgress(drawerCloseGestureStartProgress.value + event.translationX / (drawerWidth * MAIN_CARD_OPEN_TRANSLATE));
        })
        .onEnd((event) => {
          const shouldClose = event.velocityX < -SWIPE_VELOCITY || (event.velocityX < SWIPE_VELOCITY && drawerProgress.value < CLOSE_PROGRESS_THRESHOLD);
          drawerProgress.value = withTiming(
            shouldClose ? 0 : 1,
            { duration: shouldClose ? 205 : 235, easing: Easing.out(Easing.cubic) },
            (finished) => {
              if (finished && shouldClose) runOnJS(onClose)();
            },
          );
        }),
    [drawerCloseGestureStartProgress, drawerProgress, drawerWidth, gesturesEnabled, onClose, open, profileSheetOpen],
  );

  const mainAnimatedStyle = useAnimatedStyle(() => {
    const progress = drawerProgress.value;
    const scale = 1 - progress * (1 - MAIN_CARD_OPEN_SCALE);

    return {
      shadowOpacity: progress * 0.18,
      shadowRadius: 28 * progress,
      transform: [
        { translateX: progress * drawerWidth * MAIN_CARD_OPEN_TRANSLATE },
        { scale },
      ],
    };
  });

  const mainClipAnimatedStyle = useAnimatedStyle(() => {
    const radius = drawerProgress.value * MAIN_CARD_OPEN_RADIUS;

    return {
      borderTopLeftRadius: radius,
      borderBottomLeftRadius: radius,
    };
  });

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.98 + drawerProgress.value * 0.02,
    transform: [{ translateX: (drawerProgress.value - 1) * DRAWER_PARALLAX_OFFSET }],
  }));

  return (
    <GestureDetector gesture={rootGesture}>
      <View style={styles.root}>
        <GestureDetector gesture={drawerCloseGesture}>
          <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.drawer, drawerAnimatedStyle, { width: drawerWidth }]}>
            <View style={styles.drawerInner}>
              <View style={styles.headerRow}>
                <Text style={styles.brand}>Auren</Text>
                <View style={styles.headerActions}>
                  <Pressable onPress={openSearchChats} style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Search study history">
                    <Search size={32} color="rgba(15,17,21,0.92)" strokeWidth={1.85} />
                  </Pressable>
                  <Pressable onPress={onClose} style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Close menu">
                    <X size={33} color="rgba(15,17,21,0.9)" strokeWidth={1.75} />
                  </Pressable>
                </View>
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
                <Pressable onPress={openAskAuren} style={({ pressed }) => [styles.askRow, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Ask Auren">
                  <IconSlot><Sparkles size={26} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} /></IconSlot>
                  <Text style={styles.askLabel}>Ask Auren</Text>
                </Pressable>

                <View style={styles.todaySection}>
                  <Text style={styles.sectionTitle}>Today</Text>
                  <View style={styles.todayList}>
                    <Pressable onPress={openContinueProject} style={({ pressed }) => [styles.todayRow, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Continue ${continueProjectTitle}`}>
                      <IconSlot><PlayCircle size={25} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} /></IconSlot>
                      <Text style={styles.todayText} numberOfLines={1}>Continue: {continueProjectTitle}</Text>
                    </Pressable>
                    <View style={styles.todayRow}>
                      <IconSlot><Calendar size={25} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} /></IconSlot>
                      <Text style={styles.todayText} numberOfLines={1}>Next: Review biology notes</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.spacesSection}>
                  <Text style={styles.sectionTitle}>Spaces</Text>
                  <View style={styles.spaceList}>
                    <Pressable onPress={openNewProject} style={({ pressed }) => [styles.spaceRow, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="New space">
                      <IconSlot><CirclePlus size={25} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} /></IconSlot>
                      <Text style={styles.spaceTitle}>New space</Text>
                    </Pressable>

                    {loadingProjects && visibleProjects.length === 0 ? (
                      <Text style={styles.emptyRecentText}>Loading spaces...</Text>
                    ) : (
                      visibleProjects.map((project, index) => {
                        const isActive = project.id === activeProjectId;
                        return (
                          <Pressable
                            key={project.id}
                            onPress={() => openSidebarProject(project)}
                            style={({ pressed }) => [styles.spaceRow, isActive && styles.activeSpaceRow, pressed && styles.pressedSpaceRow]}
                            accessibilityRole="button"
                            accessibilityLabel={project.title}
                          >
                            <IconSlot><SpaceIcon project={project} index={index} active={isActive} /></IconSlot>
                            <Text style={[styles.spaceTitle, isActive && styles.activeSpaceTitle]} numberOfLines={1}>{project.title}</Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.historySection}>
                  <Text style={styles.sectionTitle}>Study history</Text>
                  <View style={styles.historyList}>
                    {loadingConversations ? (
                      <Text style={styles.emptyRecentText}>Loading history...</Text>
                    ) : conversations.length > 0 ? (
                      conversations.map((chat) => {
                        const isActive = chat.id === activeConversationId;
                        return (
                          <Pressable
                            key={chat.id}
                            onPress={() => onSelectConversation?.(chat.id)}
                            style={({ pressed }) => [styles.historyRow, isActive && styles.activeHistoryRow, pressed && styles.pressedHistoryRow]}
                          >
                            <Text style={[styles.historyTitle, isActive && styles.activeHistoryTitle]} numberOfLines={1}>{chat.title}</Text>
                          </Pressable>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyRecentText}>Your study history will appear here.</Text>
                    )}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.bottomBar}>
                <Pressable onPress={openProfileSheet} style={({ pressed }) => [styles.profileInline, pressed && styles.profilePressed]} accessibilityRole="button" accessibilityLabel="Open profile settings">
                  <View style={styles.avatar}><Text style={styles.avatarText}>{avatarLetter}</Text></View>
                  <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
                </Pressable>

                <Pressable onPress={openProfileSheet} style={({ pressed }) => [styles.settingsButton, pressed && styles.iconPressed]} accessibilityRole="button" accessibilityLabel="Open settings">
                  <Settings size={32} color={SIDEBAR_ICON_COLOR} strokeWidth={1.85} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>

        <Animated.View pointerEvents="box-none" style={[styles.mainCard, mainAnimatedStyle]}>
          <Animated.View style={[styles.mainScreen, mainClipAnimatedStyle]}>{children}</Animated.View>
          {open ? <Pressable style={styles.mainCloseTapTarget} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" /> : null}
        </Animated.View>

        <AurenProfileSheet visible={profileSheetOpen} profileName={profileName} avatarLetter={avatarLetter} onClose={closeProfileSheet} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  mainCard: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: -8, height: 0 },
    elevation: 20,
  },
  mainScreen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  mainCloseTapTarget: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10, overflow: 'visible', backgroundColor: DRAWER_BACKGROUND },
  drawerInner: { flex: 1, paddingTop: 66, paddingBottom: 20 },
  headerRow: { height: 62, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.text, fontFamily: serifFont, fontSize: 43, lineHeight: 50, letterSpacing: -1.25 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginRight: -4 },
  headerIconButton: { width: 46, height: 50, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, marginTop: 26 },
  scrollContent: { paddingHorizontal: 32, paddingBottom: 34 },
  iconSlot: { width: 38, alignItems: 'center', justifyContent: 'center' },
  askRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 25 },
  askLabel: { color: colors.text, fontSize: 17.8, lineHeight: 23, fontWeight: '400', letterSpacing: -0.18 },
  sectionTitle: { color: colors.text, fontSize: 16.2, lineHeight: 21, fontWeight: '700', letterSpacing: -0.16 },
  todaySection: { marginTop: 0 },
  todayList: { marginTop: 20, gap: 22 },
  todayRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 24 },
  todayText: { flex: 1, color: colors.text, fontSize: 16.4, lineHeight: 22, fontWeight: '400', letterSpacing: -0.13 },
  sectionDivider: { height: StyleSheet.hairlineWidth, marginTop: 31, marginBottom: 26, backgroundColor: 'rgba(17,24,39,0.13)' },
  spacesSection: { marginTop: 0 },
  spaceList: { marginTop: 21, gap: 19 },
  spaceRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 24, paddingRight: 8 },
  activeSpaceRow: { minHeight: 41, marginLeft: -12, paddingLeft: 12, paddingRight: 12, borderRadius: 22, backgroundColor: 'rgba(17,24,39,0.035)' },
  pressedSpaceRow: { minHeight: 41, marginLeft: -12, paddingLeft: 12, paddingRight: 12, borderRadius: 22, backgroundColor: 'rgba(17,24,39,0.045)', transform: [{ scale: 0.996 }] },
  waveIcon: { color: SIDEBAR_ICON_COLOR, fontSize: 23, lineHeight: 26, fontWeight: '500' },
  spaceTitle: { flex: 1, color: colors.text, fontSize: 16.5, lineHeight: 22, fontWeight: '400', letterSpacing: -0.14 },
  activeSpaceTitle: { color: colors.text, fontWeight: '500' },
  historySection: { marginTop: 0 },
  historyList: { marginTop: 10, gap: 8 },
  historyRow: { minHeight: 23, justifyContent: 'center', paddingRight: 8 },
  activeHistoryRow: { minHeight: 33, marginLeft: -12, paddingLeft: 12, borderRadius: 17, backgroundColor: 'rgba(17,24,39,0.035)' },
  pressedHistoryRow: { minHeight: 33, marginLeft: -12, paddingLeft: 12, paddingRight: 12, borderRadius: 17, backgroundColor: 'rgba(17,24,39,0.045)', transform: [{ scale: 0.996 }] },
  historyTitle: { color: colors.text, fontSize: 15.8, lineHeight: 21, fontWeight: '400', letterSpacing: -0.11 },
  activeHistoryTitle: { color: colors.text, fontWeight: '500' },
  emptyRecentText: { color: colors.muted, fontSize: 15.2, lineHeight: 21, fontWeight: '400', letterSpacing: -0.12 },
  bottomBar: { flexShrink: 0, minHeight: 76, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(17,24,39,0.13)', paddingTop: 12, paddingBottom: 2, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DRAWER_BACKGROUND },
  profileInline: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 22 },
  profilePressed: { opacity: 0.62, transform: [{ scale: 0.99 }] },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(15,17,21,0.86)' },
  avatarText: { color: colors.text, fontSize: 15.2, lineHeight: 19, fontWeight: '500' },
  profileName: { flexShrink: 1, color: colors.text, fontSize: 17.8, lineHeight: 24, fontWeight: '400', letterSpacing: -0.18 },
  settingsButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.58 },
  iconPressed: { opacity: 0.54, transform: [{ scale: 0.96 }] },
});
