import { BookOpen, Folder, Search, SquarePen, Trash2, X } from 'lucide-react-native';
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
import type { AurenConversation } from '../lib/aurenConversations';
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
  gesturesEnabled?: boolean;
  gestureBottomExclusion?: number;
  conversations?: AurenConversation[];
  activeConversationId?: string | null;
  activeItem?: ActiveSidebarItem;
  profileName?: string;
  avatarLetter?: string;
  loadingConversations?: boolean;
  onSelectConversation?: (conversationId: string) => void;
  onRenameConversation?: (conversation: AurenConversation, title: string) => Promise<void> | void;
  onDeleteConversation?: (conversation: AurenConversation) => Promise<void> | void;
};

const DRAWER_BACKGROUND = '#fbfbfb';
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

export function AurenSidebar({
  open,
  children,
  onClose,
  onOpen,
  onNewChat,
  onSearchChats,
  onProjects,
  gesturesEnabled = true,
  gestureBottomExclusion = 0,
  conversations = [],
  activeConversationId = null,
  activeItem = null,
  profileName = 'Auren user',
  avatarLetter = 'A',
  loadingConversations = false,
  onSelectConversation,
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
  const normalizedGestureBottomExclusion = Math.max(0, gestureBottomExclusion);

  useEffect(() => {
    openValue.value = open ? 1 : 0;
    drawerProgress.value = withTiming(open ? 1 : 0, {
      duration: open ? 310 : 255,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, [drawerProgress, open, openValue]);

  useEffect(() => {
    if (!open && actionTarget) {
      setActionTarget(null);
    }
  }, [actionTarget, open]);

  useEffect(() => {
    if (!open && profileSheetOpen) {
      setProfileSheetOpen(false);
    }
  }, [open, profileSheetOpen]);

  function openSearchChats() {
    void aurenHaptics.selection();
    setActionTarget(null);
    onSearchChats?.();
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
      setActionTarget({
        conversation,
        x: 32,
        y: Math.round(height * 0.52),
        width: width - 64,
        height: 44,
      });
      return;
    }

    rowRef.measureInWindow((x, y, rowWidth, rowHeight) => {
      setActionTarget({
        conversation,
        x,
        y,
        width: rowWidth,
        height: rowHeight,
      });
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

    if (trimmedTitle === conversation.title) {
      return;
    }

    if (actionBusyRef.current) {
      return;
    }

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
          {
            text: 'Save',
            onPress: (value) => {
              void renameConversationWithNativeAlert(conversation, value);
            },
          },
        ],
        'plain-text',
        conversation.title,
      );
      return;
    }

    Alert.alert('Rename chat', 'Renaming chats is currently available on iPhone.');
  }

  async function deleteConversationWithNativeAlert(conversation: AurenConversation) {
    if (actionBusyRef.current) {
      return;
    }

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

    Alert.alert(
      'Delete chat?',
      'You won’t see this chat here anymore. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteConversationWithNativeAlert(conversation);
          },
        },
      ],
    );
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

          const shouldOpen =
            event.velocityX > SWIPE_VELOCITY ||
            (event.velocityX > -SWIPE_VELOCITY && drawerProgress.value > OPEN_PROGRESS_THRESHOLD);
          const shouldClose =
            event.velocityX < -SWIPE_VELOCITY ||
            (event.velocityX < SWIPE_VELOCITY && drawerProgress.value < CLOSE_PROGRESS_THRESHOLD);
          const nextOpen = openValue.value > 0.01 ? !shouldClose : shouldOpen;

          drawerProgress.value = withTiming(
            nextOpen ? 1 : 0,
            {
              duration: nextOpen ? 230 : 205,
              easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
            },
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
          const isClosingDirection = event.translationX < 0;

          if (!isMostlyHorizontal || !isClosingDirection) return;

          drawerProgress.value = clampProgress(drawerCloseGestureStartProgress.value + event.translationX / drawerWidth);
        })
        .onEnd((event) => {
          const shouldClose =
            event.velocityX < -SWIPE_VELOCITY ||
            (event.velocityX < SWIPE_VELOCITY && drawerProgress.value < CLOSE_PROGRESS_THRESHOLD);

          drawerProgress.value = withTiming(
            shouldClose ? 0 : 1,
            {
              duration: shouldClose ? 205 : 230,
              easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
            },
            (finished) => {
              if (!finished) return;
              if (shouldClose) runOnJS(onClose)();
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
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                >
                  <X size={31} color="rgba(15,17,21,0.9)" strokeWidth={1.7} />
                </Pressable>
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
                <View style={styles.primaryNav}>
                  <SidebarItem
                    icon={<SquarePen size={30} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />}
                    label="New chat"
                    onPress={onNewChat}
                    active={activeItem === 'newChat'}
                  />
                  <SidebarItem
                    icon={<Folder size={31} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />}
                    label="Projects"
                    onPress={onProjects}
                    active={activeItem === 'projects'}
                  />
                </View>

                <View style={styles.recentSection}>
                  <Text style={styles.recentHeader}>Recent</Text>
                  <View style={styles.recentList}>
                    {loadingConversations ? (
                      <Text style={styles.emptyRecentText}>Loading chats...</Text>
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
                            style={({ pressed }) => [
                              styles.recentRow,
                              isActive && styles.activeRecentRow,
                              pressed && !isContextTarget && styles.pressedRecentRow,
                              isContextTarget && styles.contextRecentRow,
                            ]}
                          >
                            <Text style={[styles.recentTitle, isActive && styles.activeRecentTitle]} numberOfLines={1}>
                              {chat.title}
                            </Text>
                          </Pressable>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyRecentText}>Your chats will appear here.</Text>
                    )}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.bottomBar}>
                <Pressable
                  onPress={openProfileSheet}
                  style={({ pressed }) => [styles.profileInline, pressed && styles.profilePressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Open profile settings"
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{avatarLetter}</Text>
                  </View>
                  <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
                </Pressable>

                <View style={styles.bottomActions}>
                  <Pressable
                    style={({ pressed }) => [styles.bottomIconButton, pressed && styles.iconPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Library"
                  >
                    <BookOpen size={29} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />
                  </Pressable>
                  <Pressable
                    onPress={openSearchChats}
                    style={({ pressed }) => [styles.bottomIconButton, pressed && styles.iconPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Search chats"
                  >
                    <Search size={31} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>

        <ConversationActionMenu
          target={actionTarget}
          screenWidth={width}
          screenHeight={height}
          onClose={closeConversationActions}
          onRename={openRenameConversation}
          onDelete={openDeleteConversation}
        />

        <AurenProfileSheet
          visible={profileSheetOpen}
          profileName={profileName}
          avatarLetter={avatarLetter}
          onClose={closeProfileSheet}
        />
      </View>
    </GestureDetector>
  );
}

type SidebarItemProps = {
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
  active?: boolean;
};

function SidebarItem({ icon, label, onPress, active = false }: SidebarItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, active && styles.activeNavItem, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.navIconSlot}>{icon}</View>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
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

    if (!target) {
      return;
    }

    RNAnimated.parallel([
      RNAnimated.timing(detachProgress, {
        toValue: 1,
        duration: 210,
        easing: RNEasing.out(RNEasing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.sequence([
        RNAnimated.delay(128),
        RNAnimated.timing(menuProgress, {
          toValue: 1,
          duration: 165,
          easing: RNEasing.out(RNEasing.cubic),
          useNativeDriver: true,
        }),
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
  const menuTop = hasSpaceAbove
    ? pillTop - CONTEXT_MENU_HEIGHT - CONTEXT_VERTICAL_GAP
    : Math.min(screenHeight - CONTEXT_MENU_HEIGHT - 96, pillTop + pillHeight + CONTEXT_VERTICAL_GAP);
  const menuStartOffset = hasSpaceAbove ? 8 : -8;
  const overlayOpacity = detachProgress.interpolate({ inputRange: [0, 0.34, 1], outputRange: [0, 0, 1] });
  const pillOpacity = detachProgress.interpolate({ inputRange: [0, 0.16, 1], outputRange: [0.74, 0.95, 1] });
  const pillTranslateY = detachProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const pillScale = detachProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1] });
  const menuOpacity = menuProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const menuTranslateY = menuProgress.interpolate({ inputRange: [0, 1], outputRange: [menuStartOffset, 0] });
  const menuScale = menuProgress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.contextOverlay} onPress={onClose}>
        <RNAnimated.View pointerEvents="none" style={[styles.contextOverlayTint, { opacity: overlayOpacity }]} />

        <RNAnimated.View
          pointerEvents="none"
          style={[
            styles.contextSelectedPill,
            {
              left: pillLeft,
              top: pillTop,
              width: pillWidth,
              minHeight: pillHeight,
              opacity: pillOpacity,
              transform: [{ translateY: pillTranslateY }, { scale: pillScale }],
            },
          ]}
        >
          <Text numberOfLines={1} style={styles.contextSelectedTitle}>{target.conversation.title}</Text>
        </RNAnimated.View>

        <RNAnimated.View
          style={[
            styles.contextMenu,
            {
              left: menuLeft,
              top: menuTop,
              width: CONTEXT_MENU_WIDTH,
              opacity: menuOpacity,
              transform: [{ translateY: menuTranslateY }, { scale: menuScale }],
            },
          ]}
        >
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
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
    overflow: 'visible',
    backgroundColor: DRAWER_BACKGROUND,
  },
  drawerInner: { flex: 1, paddingTop: 66, paddingBottom: 20 },
  headerRow: {
    height: 50,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.98,
  },
  closeButton: {
    width: 50,
    height: 50,
    marginRight: -5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1, marginTop: 12 },
  scrollContent: { paddingBottom: 34 },
  primaryNav: { paddingHorizontal: 32, gap: 12 },
  navItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  activeNavItem: {
    minHeight: 66,
    marginBottom: 4,
    paddingHorizontal: 16,
    marginHorizontal: -4,
    borderRadius: 30,
    backgroundColor: 'rgba(17,24,39,0.035)',
  },
  navIconSlot: { width: 38, alignItems: 'center', justifyContent: 'center' },
  navLabel: {
    color: colors.text,
    fontSize: 20.2,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  pressed: { opacity: 0.58 },
  recentSection: { marginTop: 30, paddingHorizontal: 32 },
  recentHeader: {
    color: colors.muted,
    fontSize: 16.8,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
  recentList: { marginTop: 18, gap: 13 },
  recentRow: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    paddingRight: 8,
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0)',
  },
  activeRecentRow: {
    minHeight: 44,
    marginLeft: -12,
    paddingLeft: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(17,24,39,0.035)',
    borderColor: 'rgba(255,255,255,0)',
    shadowOpacity: 0,
    elevation: 0,
  },
  pressedRecentRow: {
    minHeight: 44,
    marginLeft: -12,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(17,24,39,0.045)',
    transform: [{ scale: 0.996 }],
  },
  contextRecentRow: {
    opacity: 0,
  },
  recentTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17.7,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  activeRecentTitle: { color: colors.text, fontWeight: '400' },
  emptyRecentText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.14,
  },
  bottomBar: {
    flexShrink: 0,
    minHeight: 70,
    paddingTop: 12,
    paddingBottom: 2,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: DRAWER_BACKGROUND,
  },
  profileInline: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  profilePressed: {
    opacity: 0.62,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d89437',
  },
  avatarText: { color: '#ffffff', fontSize: 17.5, lineHeight: 21, fontWeight: '700' },
  profileName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 18.8,
    lineHeight: 25,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
  bottomActions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bottomIconButton: {
    width: 38,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPressed: {
    opacity: 0.54,
    transform: [{ scale: 0.96 }],
  },
  contextOverlay: { flex: 1 },
  contextOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(209,211,218,0.68)',
  },
  contextMenu: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(252,252,252,0.98)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.84)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  contextMenuTapSurface: {
    overflow: 'hidden',
    borderRadius: 18,
  },
  contextMenuRow: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 22,
  },
  contextMenuRowPressed: { backgroundColor: 'rgba(17,24,39,0.045)' },
  contextMenuLabel: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400',
    letterSpacing: -0.25,
  },
  dangerText: { color: DANGER_COLOR },
  contextDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(17,24,39,0.12)' },
  contextSelectedPill: {
    position: 'absolute',
    justifyContent: 'center',
    borderRadius: 22,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.99)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 13 },
    elevation: 14,
  },
  contextSelectedTitle: {
    color: colors.text,
    fontSize: 17.7,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
});
