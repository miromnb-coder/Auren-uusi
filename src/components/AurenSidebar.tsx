import { Folder, Search, Settings, SquarePen, Trash2, X } from 'lucide-react-native';
import type { ElementRef, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing as ReanimatedEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { AurenConversation } from '../lib/aurenConversations';
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
const CONTEXT_VERTICAL_GAP = 10;

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function clampProgress(value: number) {
  'worklet';
  return Math.min(Math.max(value, 0), 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function AurenSidebar({
  open,
  children,
  onClose,
  onOpen,
  onNewChat,
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
  const [renameConversation, setRenameConversation] = useState<AurenConversation | null>(null);
  const [deleteConversation, setDeleteConversation] = useState<AurenConversation | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
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

  function openConversationActions(conversation: AurenConversation) {
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

  function openRenameConversation(conversation: AurenConversation) {
    setActionTarget(null);
    setRenameError(null);
    setRenameDraft(conversation.title);
    setRenameConversation(conversation);
  }

  function closeRenameConversation() {
    if (renameSubmitting) return;
    setRenameConversation(null);
    setRenameDraft('');
    setRenameError(null);
  }

  async function submitRenameConversation() {
    if (!renameConversation || renameSubmitting) return;

    const trimmedTitle = renameDraft.trim();
    if (!trimmedTitle) {
      setRenameError('Chat name is required.');
      return;
    }

    setRenameSubmitting(true);
    setRenameError(null);
    try {
      await onRenameConversation?.(renameConversation, trimmedTitle);
      setRenameConversation(null);
      setRenameDraft('');
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : 'Could not rename this chat.');
    } finally {
      setRenameSubmitting(false);
    }
  }

  function openDeleteConversation(conversation: AurenConversation) {
    setActionTarget(null);
    setDeleteConversation(conversation);
  }

  function closeDeleteConversation() {
    if (deleteSubmitting) return;
    setDeleteConversation(null);
  }

  async function confirmDeleteConversation() {
    if (!deleteConversation || deleteSubmitting) return;

    setDeleteSubmitting(true);
    try {
      await onDeleteConversation?.(deleteConversation);
      setDeleteConversation(null);
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const rootGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(gesturesEnabled)
        .activeOffsetX([-DRAG_ACTIVATION_DISTANCE, DRAG_ACTIVATION_DISTANCE])
        .failOffsetY([-28, 28])
        .onBegin((event) => {
          const startsAboveComposer = event.absoluteY < height - normalizedGestureBottomExclusion;
          rootGestureStartProgress.value = drawerProgress.value;
          rootGestureEligible.value = startsAboveComposer || openValue.value > 0.01 ? 1 : 0;
        })
        .onUpdate((event) => {
          if (!rootGestureEligible.value) {
            return;
          }

          const isMostlyHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY) * HORIZONTAL_DOMINANCE;
          if (!isMostlyHorizontal) {
            return;
          }

          if (openValue.value < 0.01 && event.translationX < 0) {
            return;
          }

          if (openValue.value > 0.01 && event.translationX > 0) {
            return;
          }

          drawerProgress.value = clampProgress(rootGestureStartProgress.value + event.translationX / drawerWidth);
        })
        .onEnd((event) => {
          if (!rootGestureEligible.value) {
            return;
          }

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
                if (onOpen) {
                  runOnJS(onOpen)();
                }
              } else {
                runOnJS(onClose)();
              }
            },
          );
        })
        .onFinalize(() => {
          rootGestureEligible.value = 0;
        }),
    [drawerProgress, drawerWidth, gesturesEnabled, height, normalizedGestureBottomExclusion, onClose, onOpen, openValue, rootGestureEligible, rootGestureStartProgress],
  );

  const drawerCloseGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(gesturesEnabled && open)
        .activeOffsetX([-DRAG_ACTIVATION_DISTANCE, DRAG_ACTIVATION_DISTANCE])
        .failOffsetY([-28, 28])
        .onBegin(() => {
          drawerCloseGestureStartProgress.value = drawerProgress.value;
        })
        .onUpdate((event) => {
          const isMostlyHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY) * HORIZONTAL_DOMINANCE;
          const isClosingDirection = event.translationX < 0;

          if (!isMostlyHorizontal || !isClosingDirection) {
            return;
          }

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

              if (shouldClose) {
                runOnJS(onClose)();
              }
            },
          );
        }),
    [drawerCloseGestureStartProgress, drawerProgress, drawerWidth, gesturesEnabled, onClose, open],
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
        <Animated.View style={[styles.mainScreen, mainAnimatedStyle]}>
          {children}
        </Animated.View>

        <GestureDetector gesture={drawerCloseGesture}>
          <Animated.View
            pointerEvents={open ? 'auto' : 'none'}
            style={[
              styles.drawer,
              drawerAnimatedStyle,
              {
                width: drawerWidth,
              },
            ]}
          >
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

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces
              >
                <View style={styles.primaryNav}>
                  <SidebarItem
                    icon={<SquarePen size={30} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />}
                    label="New chat"
                    onPress={onNewChat}
                    active={activeItem === 'newChat'}
                  />

                  <SidebarItem
                    icon={<Search size={32} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />}
                    label="Search chats"
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

                        return (
                          <Pressable
                            key={chat.id}
                            ref={(node) => {
                              conversationRowRefs.current[chat.id] = node;
                            }}
                            onPress={() => onSelectConversation?.(chat.id)}
                            onLongPress={() => openConversationActions(chat)}
                            delayLongPress={330}
                            style={({ pressed }) => [
                              styles.recentRow,
                              isActive && styles.activeRecentRow,
                              actionTarget?.conversation.id === chat.id && styles.contextRecentRow,
                              pressed && styles.pressed,
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
                <Pressable style={({ pressed }) => [styles.profileInline, pressed && styles.pressed]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{avatarLetter}</Text>
                  </View>

                  <Text style={styles.profileName} numberOfLines={1}>
                    {profileName}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                >
                  <Settings size={30} color={SIDEBAR_ICON_COLOR} strokeWidth={1.8} />
                </Pressable>
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

        <RenameConversationModal
          visible={Boolean(renameConversation)}
          value={renameDraft}
          error={renameError}
          submitting={renameSubmitting}
          onChangeText={setRenameDraft}
          onCancel={closeRenameConversation}
          onSubmit={submitRenameConversation}
        />

        <DeleteConversationModal
          conversation={deleteConversation}
          submitting={deleteSubmitting}
          onCancel={closeDeleteConversation}
          onConfirm={confirmDeleteConversation}
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
  if (!target) {
    return null;
  }

  const pillLeft = clamp(target.x, CONTEXT_SIDE_PADDING, Math.max(CONTEXT_SIDE_PADDING, screenWidth - target.width - CONTEXT_SIDE_PADDING));
  const pillWidth = Math.min(target.width, screenWidth - CONTEXT_SIDE_PADDING * 2);
  const pillHeight = Math.max(50, target.height + 10);
  const pillTop = clamp(target.y - 5, 72, screenHeight - pillHeight - 92);
  const menuLeft = clamp(pillLeft, CONTEXT_SIDE_PADDING, Math.max(CONTEXT_SIDE_PADDING, screenWidth - CONTEXT_MENU_WIDTH - CONTEXT_SIDE_PADDING));
  const hasSpaceAbove = pillTop > CONTEXT_MENU_HEIGHT + 78;
  const menuTop = hasSpaceAbove
    ? pillTop - CONTEXT_MENU_HEIGHT - CONTEXT_VERTICAL_GAP
    : Math.min(screenHeight - CONTEXT_MENU_HEIGHT - 96, pillTop + pillHeight + CONTEXT_VERTICAL_GAP);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.contextOverlay} onPress={onClose}>
        <View
          pointerEvents="none"
          style={[
            styles.contextSelectedPill,
            {
              left: pillLeft,
              top: pillTop,
              width: pillWidth,
              minHeight: pillHeight,
            },
          ]}
        >
          <Text numberOfLines={1} style={styles.contextSelectedTitle}>{target.conversation.title}</Text>
        </View>

        <Pressable
          style={[
            styles.contextMenu,
            {
              left: menuLeft,
              top: menuTop,
              width: CONTEXT_MENU_WIDTH,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <Pressable style={({ pressed }) => [styles.contextMenuRow, pressed && styles.pressed]} onPress={() => onRename(target.conversation)}>
            <Text style={styles.contextMenuLabel}>Rename</Text>
            <SquarePen size={23} color={SIDEBAR_ICON_COLOR} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.contextDivider} />
          <Pressable style={({ pressed }) => [styles.contextMenuRow, pressed && styles.pressed]} onPress={() => onDelete(target.conversation)}>
            <Text style={[styles.contextMenuLabel, styles.dangerText]}>Delete</Text>
            <Trash2 size={23} color={DANGER_COLOR} strokeWidth={1.9} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type RenameConversationModalProps = {
  visible: boolean;
  value: string;
  error: string | null;
  submitting: boolean;
  onChangeText: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

function RenameConversationModal({ visible, value, error, submitting, onChangeText, onCancel, onSubmit }: RenameConversationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.renameCard}>
          <Text style={styles.modalTitle}>Rename chat</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            autoFocus
            selectTextOnFocus
            editable={!submitting}
            style={styles.renameInput}
            placeholder="Chat name"
            placeholderTextColor="rgba(104,103,117,0.55)"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable disabled={submitting} style={({ pressed }) => [styles.modalActionButton, pressed && styles.pressed]} onPress={onCancel}>
              <Text style={styles.cancelActionText}>Cancel</Text>
            </Pressable>
            <View style={styles.modalActionDivider} />
            <Pressable disabled={submitting} style={({ pressed }) => [styles.modalActionButton, pressed && styles.pressed]} onPress={onSubmit}>
              <Text style={styles.confirmActionText}>{submitting ? 'Saving...' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type DeleteConversationModalProps = {
  conversation: AurenConversation | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteConversationModal({ conversation, submitting, onCancel, onConfirm }: DeleteConversationModalProps) {
  return (
    <Modal visible={Boolean(conversation)} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.deleteCard}>
          <Text style={styles.modalTitle}>Delete chat?</Text>
          <Text style={styles.deleteMessage}>You won’t see this chat here anymore. This cannot be undone.</Text>
          {conversation ? <Text numberOfLines={1} style={styles.deleteTitle}>{conversation.title}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable disabled={submitting} style={({ pressed }) => [styles.modalActionButton, pressed && styles.pressed]} onPress={onCancel}>
              <Text style={styles.cancelActionText}>Cancel</Text>
            </Pressable>
            <View style={styles.modalActionDivider} />
            <Pressable disabled={submitting} style={({ pressed }) => [styles.modalActionButton, pressed && styles.pressed]} onPress={onConfirm}>
              <Text style={styles.deleteActionText}>{submitting ? 'Deleting...' : 'Delete'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  mainScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
    overflow: 'visible',
    backgroundColor: DRAWER_BACKGROUND,
  },
  drawerInner: {
    flex: 1,
    paddingTop: 66,
    paddingBottom: 20,
  },
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
  scroll: {
    flex: 1,
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 34,
  },
  primaryNav: {
    paddingHorizontal: 32,
    gap: 12,
  },
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
  navIconSlot: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: colors.text,
    fontSize: 20.2,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  pressed: {
    opacity: 0.58,
  },
  recentSection: {
    marginTop: 30,
    paddingHorizontal: 32,
  },
  recentHeader: {
    color: colors.muted,
    fontSize: 16.8,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
  recentList: {
    marginTop: 18,
    gap: 13,
  },
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
  contextRecentRow: {
    minHeight: 44,
    marginLeft: -12,
    paddingLeft: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  recentTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17.7,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  activeRecentTitle: {
    color: colors.text,
    fontWeight: '400',
  },
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
    justifyContent: 'space-between',
    gap: 20,
    backgroundColor: DRAWER_BACKGROUND,
  },
  profileInline: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d89437',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 17.5,
    lineHeight: 21,
    fontWeight: '700',
  },
  profileName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 18.8,
    lineHeight: 25,
    fontWeight: '400',
    letterSpacing: -0.22,
  },
  settingsButton: {
    width: 56,
    height: 56,
    marginRight: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,22,28,0.22)',
  },
  contextMenu: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(250,250,250,0.96)',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  contextMenuRow: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 22,
  },
  contextMenuLabel: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400',
    letterSpacing: -0.25,
  },
  dangerText: {
    color: DANGER_COLOR,
  },
  contextDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(17,24,39,0.12)',
  },
  contextSelectedPill: {
    position: 'absolute',
    justifyContent: 'center',
    borderRadius: 29,
    paddingHorizontal: 26,
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  contextSelectedTitle: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(20,22,28,0.22)',
  },
  renameCard: {
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    borderRadius: 20,
    paddingTop: 28,
    backgroundColor: 'rgba(250,250,250,0.98)',
  },
  deleteCard: {
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    borderRadius: 20,
    paddingTop: 26,
    backgroundColor: 'rgba(250,250,250,0.98)',
  },
  modalTitle: {
    paddingHorizontal: 24,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.42,
    textAlign: 'center',
  },
  renameInput: {
    minHeight: 52,
    marginTop: 24,
    marginHorizontal: 24,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.18)',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
  },
  errorText: {
    marginTop: 10,
    paddingHorizontal: 24,
    color: DANGER_COLOR,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  deleteMessage: {
    marginTop: 10,
    paddingHorizontal: 28,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.12,
    textAlign: 'center',
  },
  deleteTitle: {
    marginTop: 14,
    marginHorizontal: 28,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalActions: {
    minHeight: 64,
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(17,24,39,0.16)',
    flexDirection: 'row',
  },
  modalActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(17,24,39,0.16)',
  },
  cancelActionText: {
    color: '#147efb',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
  },
  confirmActionText: {
    color: '#147efb',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
  },
  deleteActionText: {
    color: DANGER_COLOR,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '600',
  },
});
