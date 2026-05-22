import { Folder, Search, Settings, SquarePen, X } from 'lucide-react-native';
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

const DRAWER_BACKGROUND = '#fbfbfb';
const SIDEBAR_ICON_COLOR = 'rgba(15,17,21,0.88)';
const ICON_STROKE_WIDTH = 1.78;

const DRAG_ACTIVATION_DISTANCE = 8;
const HORIZONTAL_DOMINANCE = 1.18;
const SWIPE_VELOCITY = 720;
const OPEN_PROGRESS_THRESHOLD = 0.38;
const CLOSE_PROGRESS_THRESHOLD = 0.62;

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

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

  const drawerWidth = useMemo(() => width, [width]);
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
                    highlighted
                  />

                  <SidebarItem
                    icon={<Search size={32} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />}
                    label="Search chats"
                  />

                  <SidebarItem
                    icon={<Folder size={31} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />}
                    label="Projects"
                    onPress={onProjects}
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
      </View>
    </GestureDetector>
  );
}

type SidebarItemProps = {
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
  highlighted?: boolean;
};

function SidebarItem({ icon, label, onPress, highlighted = false }: SidebarItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, highlighted && styles.highlightedNavItem, pressed && styles.pressed]}
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
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: DRAWER_BACKGROUND,
  },
  drawerInner: {
    flex: 1,
    paddingTop: 66,
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  headerRow: {
    height: 50,
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
    paddingBottom: 22,
  },
  primaryNav: {
    gap: 12,
  },
  navItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  highlightedNavItem: {
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
    paddingLeft: 8,
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
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0)',
    shadowOpacity: 0,
    elevation: 0,
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
});
