import { BookOpen, Folder, Home, SquarePen } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  profileName?: string;
  avatarLetter?: string;
  loadingConversations?: boolean;
  onSelectConversation?: (conversationId: string) => void;
};

const DRAWER_WIDTH_RATIO = 0.82;
const DRAWER_MIN_WIDTH = 316;
const DRAWER_MAX_WIDTH = 470;

const DRAWER_BACKGROUND = '#fbfbfb';
const SIDEBAR_ICON_COLOR = 'rgba(34,27,23,0.84)';
const ICON_STROKE_WIDTH = 1.82;

const DRAG_ACTIVATION_DISTANCE = 8;
const HORIZONTAL_DOMINANCE = 1.18;
const SWIPE_VELOCITY = 720;
const OPEN_PROGRESS_THRESHOLD = 0.38;
const CLOSE_PROGRESS_THRESHOLD = 0.62;

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function sidebarIcon(icon: ReactNode) {
  return icon;
}

function clampProgress(value: number) {
  'worklet';
  return Math.min(Math.max(value, 0), 1);
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
  profileName = 'Auren user',
  avatarLetter = 'A',
  loadingConversations = false,
  onSelectConversation,
}: AurenSidebarProps) {
  const { width, height } = useWindowDimensions();
  const drawerProgress = useSharedValue(open ? 1 : 0);
  const openValue = useSharedValue(open ? 1 : 0);
  const rootGestureStartProgress = useSharedValue(open ? 1 : 0);
  const rootGestureEligible = useSharedValue(0);
  const drawerCloseGestureStartProgress = useSharedValue(1);

  const drawerWidth = useMemo(() => {
    const measuredWidth = width * DRAWER_WIDTH_RATIO;
    return Math.min(Math.max(measuredWidth, DRAWER_MIN_WIDTH), Math.min(DRAWER_MAX_WIDTH, width - 58));
  }, [width]);

  const normalizedGestureBottomExclusion = Math.max(0, gestureBottomExclusion);

  useEffect(() => {
    openValue.value = open ? 1 : 0;
    drawerProgress.value = withTiming(open ? 1 : 0, {
      duration: open ? 310 : 255,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, [drawerProgress, open, openValue]);

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

  const visibleMainWidth = Math.max(width - drawerWidth, 58);

  return (
    <GestureDetector gesture={rootGesture}>
      <View style={styles.root}>
        <Animated.View style={[styles.mainScreen, mainAnimatedStyle]}>
          {children}
        </Animated.View>

        {open ? (
          <Animated.View style={[styles.peekCloseArea, { width: visibleMainWidth }]}> 
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
        ) : null}

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
              <View style={styles.leftShiftedContent}>
                <View style={styles.topBar}>
                  <Text style={styles.brand}>Auren</Text>
                  <Text style={styles.subtitle}>Your study assistant</Text>
                </View>

                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces
                >
                  <View style={styles.primaryNav}>
                    <SidebarItem
                      icon={sidebarIcon(<Home size={27} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                      label="Home"
                      onPress={onClose}
                    />

                    <SidebarItem
                      icon={sidebarIcon(<SquarePen size={26} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                      label="New chat"
                      onPress={onNewChat}
                    />

                    <SidebarItem
                      icon={sidebarIcon(<BookOpen size={27} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                      label="Study modes"
                    />

                    <SidebarItem
                      icon={sidebarIcon(<Folder size={28} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                      label="Projects"
                      onPress={onProjects}
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.recentList}>
                    {loadingConversations ? (
                      <Text style={styles.emptyRecentText}>Loading chats...</Text>
                    ) : conversations.length > 0 ? (
                      conversations.map((chat) => {
                        const isActive = chat.id === activeConversationId;

                        return (
                          <Pressable
                            key={chat.id}
                            onPress={() => onSelectConversation?.(chat.id)}
                            style={({ pressed }) => [
                              styles.recentRow,
                              isActive && styles.activeRecentRow,
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
                </ScrollView>
              </View>

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
                  onPress={onNewChat}
                  style={({ pressed }) => [styles.composeButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Start a new chat"
                >
                  <SquarePen size={26} color={SIDEBAR_ICON_COLOR} strokeWidth={1.85} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureDetector>
  );
}

type SidebarItemProps = {
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
};

function SidebarItem({ icon, label, onPress }: SidebarItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.navIconSlot}>{icon}</View>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
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
  peekCloseArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 12,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
    overflow: 'hidden',
    borderTopRightRadius: 34,
    borderBottomRightRadius: 34,
    backgroundColor: DRAWER_BACKGROUND,
    shadowColor: '#111827',
    shadowOpacity: 0.055,
    shadowRadius: 34,
    shadowOffset: { width: 12, height: 0 },
    elevation: 10,
  },
  drawerInner: {
    flex: 1,
    paddingTop: 74,
    paddingHorizontal: 38,
    paddingBottom: 24,
  },
  leftShiftedContent: {
    flex: 1,
    marginLeft: -12,
    paddingRight: 12,
  },
  topBar: {
    flexShrink: 0,
    paddingBottom: 38,
    backgroundColor: DRAWER_BACKGROUND,
  },
  brand: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.4,
  },
  subtitle: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  primaryNav: {
    gap: 16,
  },
  navItem: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 35,
  },
  navIconSlot: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: colors.text,
    fontSize: 18.5,
    lineHeight: 25,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.58,
  },
  divider: {
    height: 1,
    marginTop: 28,
    marginBottom: 24,
    backgroundColor: 'rgba(17,24,39,0.085)',
  },
  recentList: {
    gap: 12,
  },
  recentRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    paddingLeft: 4,
    paddingRight: 6,
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0)',
  },
  activeRecentRow: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0)',
    shadowOpacity: 0,
    elevation: 0,
  },
  recentTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16.7,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.16,
  },
  activeRecentTitle: {
    color: colors.text,
    fontWeight: '400',
  },
  emptyRecentText: {
    color: colors.muted,
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.13,
    paddingLeft: 4,
  },
  bottomBar: {
    flexShrink: 0,
    minHeight: 72,
    paddingTop: 16,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 22,
    backgroundColor: DRAWER_BACKGROUND,
  },
  profileInline: {
    width: 168,
    minHeight: 58,
    marginLeft: -12,
    paddingLeft: 10,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    shadowColor: '#111827',
    shadowOpacity: 0.028,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d89437',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16.5,
    lineHeight: 20,
    fontWeight: '700',
  },
  profileName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 17.5,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  composeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    shadowColor: '#111827',
    shadowOpacity: 0.035,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 9 },
    elevation: 3,
  },
});
