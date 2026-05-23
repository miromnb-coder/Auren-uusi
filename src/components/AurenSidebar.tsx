import { Search, SquarePen, Trash2, X } from 'lucide-react-native';
import type { ElementRef, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated as RNAnimated, Easing as RNEasing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing as ReanimatedEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AurenProfileSheet } from './AurenProfileSheet';
import type { AurenConversation, AurenProject } from '../lib/aurenConversations';
import { aurenHaptics } from '../lib/aurenHaptics';
import { colors } from '../theme';

type ActiveSidebarItem = 'newChat' | 'projects' | null;

type ConversationContextTarget = {
  conversation: AurenConversation;
  x: number;
  y: number;
  width: number;
  height: number;
};

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
const DANGER_COLOR = '#ef4444';
const ICON_STROKE_WIDTH = 1.78;

const DRAG_ACTIVATION_DISTANCE = 8;
const HORIZONTAL_DOMINANCE = 1.18;
const SWIPE_VELOCITY = 720;
const OPEN_PROGRESS_THRESHOLD = 0.38;
const CLOSE_PROGRESS_THRESHOLD = 0.62;
const CONTEXT_MENU_WIDTH = 228;
const CONTEXT_MENU_HEIGHT = 117;
const CONTEXT_SIDE_PADDING = 30;
const CONTEXT_VERTICAL_GAP = 12;
const CONTEXT_PILL_HORIZONTAL_INSET = 0;
const CONVERSATION_LONG_PRESS_DELAY = 355;
const SIDEBAR_PROJECT_LIMIT = 4;

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function clampProgress(value: number) {
  'worklet';
  return Math.min(Math.max(value, 0), 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getActionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getSpaceMarker(index: number, active: boolean) {
  if (active || index === 0) return '✧';
  if (index === 1) return '○';
  if (index === 2) return '◇';
  return '⌁';
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
  onRenameConversation,
  onDeleteConversation,
}: AurenSidebarProps) {
  const { width, height } = useWindowDimensions();
  const [actionTarget, setActionTarget] = useState<ConversationContextTarget | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const actionBusyRef = useRef(false);
  const conversationRowRefs = useRef<Record<string, ElementRef<typeof Pressable> | null>>({});
  const drawerProgress = useSharedValue(open ? 1 : 0);
  const openValue = useSharedValue(open ? 1 : 0);
  const rootGestureStartProgress = useSharedValue(open ? 1 : 0);
  const rootGestureEligible = useSharedValue(0);
  const drawerCloseGestureStartProgress = useSharedValue(1);

  const drawerWidth = useMemo(() => width, [width]);
  const visibleProjects = useMemo(() => projects.slice(0, SIDEBAR_PROJECT_LIMIT), [projects]);
  const continueProjectTitle = visibleProjects[0]?.title ?? 'Opiskelu';
  const normalizedGestureBottomExclusion = Math.max(0, gestureBottomExclusion);

  useEffect(() => {
    openValue.value = open ? 1 : 0;
    drawerProgress.value = withTiming(open ? 1 : 0, {
      duration: open ? 310 : 255,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, [drawerProgress, open, openValue]);

  useEffect(() => {
    if (!open && actionTarget) setActionTarget(null);
  }, [actionTarget, open]);

  useEffect(() => {
    if (!open && profileSheetOpen) setProfileSheetOpen(false);
  }, [open, profileSheetOpen]);

  function openSearchChats() {
    void aurenHaptics.selection();
    setActionTarget(null);
    onSearchChats?.();
  }

  function openAskAuren() {
    void aurenHaptics.selection();
    setActionTarget(null);
    onNewChat?.();
  }

  function openNewProject() {
    void aurenHaptics.selection();
    setActionTarget(null);
    onNewProject?.();
  }

  function openSidebarProject(project: AurenProject) {
    void aurenHaptics.selection();
    setActionTarget(null);
    onSelectProject?.(project);
  }

  function openProfileSheet() {
    void aurenHaptics.panelOpen();
    setActionTarget(null);
    setProfileSheetOpen(true);
  }

  function closeProfileSheet() {
    void aurenHaptics.panelClose();
    setProfileSheetOpen(false);
  }

  function openConversationActions(conversation: AurenConversation) {
    void aurenHaptics.contextMenu();
    const rowRef = conversationRowRefs.current[conversation.id];

    if (!rowRef?.measureInWindow) {
      setActionTarget({ conversation, x: 32, y: Math.round(height * 0.52), width: width - 64, height: 44 });
      return;
    }

    rowRef.measureInWindow((x, y, rowWidth, rowHeight) => {
      setActionTarget({ conversation, x, y, width: rowWidth, height: rowHeight });
    });
  }

  function closeConversationActions() {
    setActionTarget(null);
  }

  async function renameConversationWithNativeAlert(conversation: AurenConversation, nextTitle?: string) {
    const trimmedTitle = nextTitle?.trim() ?? '';
    if (!trimmedTitle) {
      Alert.alert('Rename chat', 'Chat name is required.');
      return;
    }
    if (trimmedTitle === conversation.title || actionBusyRef.current) return;

    actionBusyRef.current = true;
    try {
      await onRenameConversation?.(conversation, trimmedTitle);
    } catch (error) {
      Alert.alert('Could not rename chat', getActionErrorMessage(error, 'Please try again.'));
    } finally {
      actionBusyRef.current = false;
    }
  }

  function openRenameConversation(conversation: AurenConversation) {
    void aurenHaptics.selection();
    setActionTarget(null);

    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename chat',
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (value) => void renameConversationWithNativeAlert(conversation, value) },
        ],
        'plain-text',
        conversation.title,
      );
      return;
    }

    Alert.alert('Rename chat', 'Renaming chats is currently available on iPhone.');
  }

  async function deleteConversationWithNativeAlert(conversation: AurenConversation) {
    if (actionBusyRef.current) return;
    actionBusyRef.current = true;
    try {
      await onDeleteConversation?.(conversation);
    } catch (error) {
      Alert.alert('Could not delete chat', getActionErrorMessage(error, 'Please try again.'));
    } finally {
      actionBusyRef.current = false;
    }
  }

  function openDeleteConversation(conversation: AurenConversation) {
    void aurenHaptics.selection();
    setActionTarget(null);
    Alert.alert('Delete chat?', 'This chat will be removed from your study history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteConversationWithNativeAlert(conversation) },
    ]);
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
          drawerProgress.value = clampProgress(rootGestureStartProgress.value + event.translationX / drawerWidth);
        })
        .onEnd((event) => {
          if (!rootGestureEligible.value) return;
          const shouldOpen = event.velocityX > SWIPE_VELOCITY || (event.velocityX > -SWIPE_VELOCITY && drawerProgress.value > OPEN_PROGRESS_THRESHOLD);
          const shouldClose = event.velocityX < -SWIPE_VELOCITY || (event.velocityX < SWIPE_VELOCITY && drawerProgress.value < CLOSE_PROGRESS_THRESHOLD);
          const nextOpen = openValue.value > 0.01 ? !shouldClose : shouldOpen;
          drawerProgress.value = withTiming(
            nextOpen ? 1 : 0,
            { duration: nextOpen ? 230 : 205, easing: ReanimatedEasing.out(ReanimatedEasing.cubic) },
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
          drawerProgress.value = clampProgress(drawerCloseGestureStartProgress.value + event.translationX / drawerWidth);
        })
        .onEnd((event) => {
          const shouldClose = event.velocityX < -SWIPE_VELOCITY || (event.velocityX < SWIPE_VELOCITY && drawerProgress.value < CLOSE_PROGRESS_THRESHOLD);
          drawerProgress.value = withTiming(
            shouldClose ? 0 : 1,
            { duration: shouldClose ? 205 : 230, easing: ReanimatedEasing.out(ReanimatedEasing.cubic) },
            (finished) => {
              if (finished && shouldClose) runOnJS(onClose)();
            },
          );
        }),
    [drawerCloseGestureStartProgress, drawerProgress, drawerWidth, gesturesEnabled, onClose, open, profileSheetOpen],
  );

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerProgress.value * drawerWidth }],
  }));

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -drawerWidth + drawerProgress.value * drawerWidth }],
  }));

  return (
    <GestureDetector gesture={rootGesture}>
      <View style={styles.root}>
        <Animated.View style={[styles.mainScreen, mainAnimatedStyle]}>{children}</Animated.View>

        <GestureDetector gesture={drawerCloseGesture}>
          <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.drawer, drawerAnimatedStyle, { width: drawerWidth }]}>
            <View style={styles.drawerInner}>
              <View style={styles.headerRow}>
                <Text style={styles.brand}>Auren</Text>
                <View style={styles.headerActions}>
                  <Pressable onPress={openSearchChats} style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Search study history">
                    <Search size={32} color="rgba(15,17,21,0.92)" strokeWidth={1.75} />
                  </Pressable>
                  <Pressable onPress={onClose} style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Close menu">
                    <X size={33} color="rgba(15,17,21,0.9)" strokeWidth={1.7} />
                  </Pressable>
                </View>
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
                <Pressable onPress={openAskAuren} style={({ pressed }) => [styles.askRow, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Ask Auren">
                  <Text style={styles.askIcon}>✧</Text>
                  <Text style={styles.askLabel}>Ask Auren</Text>
                </Pressable>

                <View style={styles.todaySection}>
                  <Text style={styles.sectionTitle}>Today</Text>
                  <View style={styles.todayList}>
                    <Pressable onPress={() => (visibleProjects[0] ? openSidebarProject(visibleProjects[0]) : undefined)} style={({ pressed }) => [styles.todayRow, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Continue ${continueProjectTitle}`}>
                      <Text style={styles.lineIcon}>▷</Text>
                      <Text style={styles.todayText} numberOfLines={1}>Continue: {continueProjectTitle}</Text>
                    </Pressable>
                    <View style={styles.todayRow}>
                      <Text style={styles.lineIcon}>□</Text>
                      <Text style={styles.todayText} numberOfLines={1}>Next: Review biology notes</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.spacesSection}>
                  <Text style={styles.sectionTitle}>Spaces</Text>
                  <View style={styles.spaceList}>
                    <Pressable onPress={openNewProject} style={({ pressed }) => [styles.spaceRow, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="New space">
                      <Text style={styles.spaceIcon}>⊕</Text>
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
                            <Text style={[styles.spaceIcon, isActive && styles.activeSpaceIcon]}>{getSpaceMarker(index, isActive)}</Text>
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
                        const isContextTarget = actionTarget?.conversation.id === chat.id;
                        return (
                          <Pressable
                            key={chat.id}
                            ref={(node) => {
                              conversationRowRefs.current[chat.id] = node;
                            }}
                            collapsable={false}
                            onPress={() => onSelectConversation?.(chat.id)}
                            onLongPress={() => openConversationActions(chat)}
                            delayLongPress={CONVERSATION_LONG_PRESS_DELAY}
                            style={({ pressed }) => [styles.historyRow, isActive && styles.activeHistoryRow, pressed && !isContextTarget && styles.pressedHistoryRow, isContextTarget && styles.contextRecentRow]}
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
                  <Text style={styles.settingsIcon}>⚙</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>

        <ConversationActionMenu target={actionTarget} screenWidth={width} screenHeight={height} onClose={closeConversationActions} onRename={openRenameConversation} onDelete={openDeleteConversation} />
        <AurenProfileSheet visible={profileSheetOpen} profileName={profileName} avatarLetter={avatarLetter} onClose={closeProfileSheet} />
      </View>
    </GestureDetector>
  );
}

type ConversationActionMenuProps = {
  target: ConversationContextTarget | null;
  screenWidth: number;
  screenHeight: number;
  onClose: () => void;
  onRename: (conversation: AurenConversation) => void;
  onDelete: (conversation: AurenConversation) => void;
};

function ConversationActionMenu({ target, screenWidth, screenHeight, onClose, onRename, onDelete }: ConversationActionMenuProps) {
  const detachProgress = useRef(new RNAnimated.Value(0)).current;
  const menuProgress = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    detachProgress.stopAnimation();
    menuProgress.stopAnimation();
    detachProgress.setValue(0);
    menuProgress.setValue(0);
    if (!target) return;

    RNAnimated.parallel([
      RNAnimated.timing(detachProgress, { toValue: 1, duration: 210, easing: RNEasing.out(RNEasing.cubic), useNativeDriver: true }),
      RNAnimated.sequence([
        RNAnimated.delay(128),
        RNAnimated.timing(menuProgress, { toValue: 1, duration: 165, easing: RNEasing.out(RNEasing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [detachProgress, menuProgress, target]);

  if (!target) return null;

  const desiredPillLeft = target.x - CONTEXT_PILL_HORIZONTAL_INSET;
  const desiredPillWidth = target.width + CONTEXT_PILL_HORIZONTAL_INSET * 2;
  const pillWidth = Math.min(desiredPillWidth, screenWidth - 40);
  const pillLeft = clamp(desiredPillLeft, 20, Math.max(20, screenWidth - pillWidth - 20));
  const pillHeight = Math.max(44, target.height);
  const pillTop = clamp(target.y, 72, screenHeight - pillHeight - 92);
  const menuLeft = clamp(pillLeft, CONTEXT_SIDE_PADDING, Math.max(CONTEXT_SIDE_PADDING, screenWidth - CONTEXT_MENU_WIDTH - CONTEXT_SIDE_PADDING));
  const hasSpaceAbove = pillTop > CONTEXT_MENU_HEIGHT + 78;
  const menuTop = hasSpaceAbove ? pillTop - CONTEXT_MENU_HEIGHT - CONTEXT_VERTICAL_GAP : Math.min(screenHeight - CONTEXT_MENU_HEIGHT - 96, pillTop + pillHeight + CONTEXT_VERTICAL_GAP);
  const menuStartOffset = hasSpaceAbove ? 8 : -8;
  const overlayOpacity = detachProgress.interpolate({ inputRange: [0, 0.34, 1], outputRange: [0, 0, 1] });
  const pillOpacity = detachProgress.interpolate({ inputRange: [0, 0.16, 1], outputRange: [0.74, 0.95, 1] });
  const pillTranslateY = detachProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const menuOpacity = menuProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const menuTranslateY = menuProgress.interpolate({ inputRange: [0, 1], outputRange: [menuStartOffset, 0] });
  const menuScale = menuProgress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.contextOverlay} onPress={onClose}>
        <RNAnimated.View pointerEvents="none" style={[styles.contextOverlayTint, { opacity: overlayOpacity }]} />
        <RNAnimated.View pointerEvents="none" style={[styles.contextSelectedPill, { left: pillLeft, top: pillTop, width: pillWidth, minHeight: pillHeight, opacity: pillOpacity, transform: [{ translateY: pillTranslateY }] }]}>
          <Text numberOfLines={1} style={styles.contextSelectedTitle}>{target.conversation.title}</Text>
        </RNAnimated.View>
        <RNAnimated.View style={[styles.contextMenu, { left: menuLeft, top: menuTop, width: CONTEXT_MENU_WIDTH, opacity: menuOpacity, transform: [{ translateY: menuTranslateY }, { scale: menuScale }] }]}>
          <Pressable style={styles.contextMenuTapSurface} onPress={(event) => event.stopPropagation()}>
            <Pressable style={({ pressed }) => [styles.contextMenuRow, pressed && styles.contextMenuRowPressed]} onPress={() => onRename(target.conversation)}>
              <Text style={styles.contextMenuLabel}>Rename</Text>
              <SquarePen size={23} color={SIDEBAR_ICON_COLOR} strokeWidth={1.8} />
            </Pressable>
            <View style={styles.contextDivider} />
            <Pressable style={({ pressed }) => [styles.contextMenuRow, pressed && styles.contextMenuRowPressed]} onPress={() => onDelete(target.conversation)}>
              <Text style={[styles.contextMenuLabel, styles.dangerText]}>Delete</Text>
              <Trash2 size={23} color={DANGER_COLOR} strokeWidth={1.9} />
            </Pressable>
          </Pressable>
        </RNAnimated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  mainScreen: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 20, overflow: 'visible', backgroundColor: DRAWER_BACKGROUND },
  drawerInner: { flex: 1, paddingTop: 66, paddingBottom: 20 },
  headerRow: { height: 62, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.text, fontFamily: serifFont, fontSize: 43, lineHeight: 50, letterSpacing: -1.25 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginRight: -4 },
  headerIconButton: { width: 46, height: 50, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, marginTop: 26 },
  scrollContent: { paddingHorizontal: 32, paddingBottom: 34 },
  askRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 22, marginBottom: 25 },
  askIcon: { width: 38, color: SIDEBAR_ICON_COLOR, fontSize: 31, lineHeight: 36, textAlign: 'center', fontWeight: '300' },
  askLabel: { color: colors.text, fontSize: 17.8, lineHeight: 23, fontWeight: '400', letterSpacing: -0.18 },
  sectionTitle: { color: colors.text, fontSize: 16.2, lineHeight: 21, fontWeight: '700', letterSpacing: -0.16 },
  todaySection: { marginTop: 0 },
  todayList: { marginTop: 20, gap: 22 },
  todayRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 24 },
  lineIcon: { width: 34, color: SIDEBAR_ICON_COLOR, fontSize: 24, lineHeight: 29, textAlign: 'center', fontWeight: '400' },
  todayText: { flex: 1, color: colors.text, fontSize: 16.4, lineHeight: 22, fontWeight: '400', letterSpacing: -0.13 },
  sectionDivider: { height: StyleSheet.hairlineWidth, marginTop: 31, marginBottom: 26, backgroundColor: 'rgba(17,24,39,0.13)' },
  spacesSection: { marginTop: 0 },
  spaceList: { marginTop: 21, gap: 19 },
  spaceRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 24, paddingRight: 8 },
  activeSpaceRow: { minHeight: 41, marginLeft: -12, paddingLeft: 12, paddingRight: 12, borderRadius: 22, backgroundColor: 'rgba(17,24,39,0.035)' },
  pressedSpaceRow: { minHeight: 41, marginLeft: -12, paddingLeft: 12, paddingRight: 12, borderRadius: 22, backgroundColor: 'rgba(17,24,39,0.045)', transform: [{ scale: 0.996 }] },
  spaceIcon: { width: 34, color: SIDEBAR_ICON_COLOR, fontSize: 26, lineHeight: 30, textAlign: 'center', fontWeight: '300' },
  activeSpaceIcon: { color: colors.text },
  spaceTitle: { flex: 1, color: colors.text, fontSize: 16.5, lineHeight: 22, fontWeight: '400', letterSpacing: -0.14 },
  activeSpaceTitle: { color: colors.text, fontWeight: '500' },
  historySection: { marginTop: 0 },
  historyList: { marginTop: 10, gap: 8 },
  historyRow: { minHeight: 23, justifyContent: 'center', paddingRight: 8 },
  activeHistoryRow: { minHeight: 33, marginLeft: -12, paddingLeft: 12, borderRadius: 17, backgroundColor: 'rgba(17,24,39,0.035)' },
  pressedHistoryRow: { minHeight: 33, marginLeft: -12, paddingLeft: 12, paddingRight: 12, borderRadius: 17, backgroundColor: 'rgba(17,24,39,0.045)', transform: [{ scale: 0.996 }] },
  contextRecentRow: { opacity: 0 },
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
  settingsIcon: { color: colors.text, fontSize: 30, lineHeight: 35, fontWeight: '400' },
  pressed: { opacity: 0.58 },
  iconPressed: { opacity: 0.54, transform: [{ scale: 0.96 }] },
  contextOverlay: { flex: 1 },
  contextOverlayTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(209,211,218,0.68)' },
  contextMenu: { position: 'absolute', overflow: 'hidden', borderRadius: 18, backgroundColor: 'rgba(252,252,252,0.98)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.84)', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 14 },
  contextMenuTapSurface: { overflow: 'hidden', borderRadius: 18 },
  contextMenuRow: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 22 },
  contextMenuRowPressed: { backgroundColor: 'rgba(17,24,39,0.045)' },
  contextMenuLabel: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '400', letterSpacing: -0.25 },
  dangerText: { color: DANGER_COLOR },
  contextDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(17,24,39,0.12)' },
  contextSelectedPill: { position: 'absolute', justifyContent: 'center', borderRadius: 22, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.99)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 13 }, elevation: 14 },
  contextSelectedTitle: { color: colors.text, fontSize: 17.7, lineHeight: 23, fontWeight: '400', letterSpacing: -0.18 },
});
