import { BookOpen, Folder, Home, SquarePen } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { AurenConversation } from '../lib/aurenConversations';
import { colors } from '../theme';

type AurenSidebarProps = {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  onNewChat?: () => void;
  conversations?: AurenConversation[];
  activeConversationId?: string | null;
  profileName?: string;
  avatarLetter?: string;
  loadingConversations?: boolean;
  onSelectConversation?: (conversationId: string) => void;
};

const DRAWER_WIDTH_RATIO = 0.79;
const DRAWER_MIN_WIDTH = 292;
const DRAWER_MAX_WIDTH = 440;
const SIDEBAR_ICON_COLOR = 'rgba(34,27,23,0.84)';
const ICON_STROKE_WIDTH = 1.82;
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function sidebarIcon(icon: ReactNode) {
  return icon;
}

export function AurenSidebar({
  open,
  children,
  onClose,
  onNewChat,
  conversations = [],
  activeConversationId = null,
  profileName = 'Auren user',
  avatarLetter = 'A',
  loadingConversations = false,
  onSelectConversation,
}: AurenSidebarProps) {
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;

  const drawerWidth = useMemo(() => {
    const measuredWidth = width * DRAWER_WIDTH_RATIO;
    return Math.min(Math.max(measuredWidth, DRAWER_MIN_WIDTH), Math.min(DRAWER_MAX_WIDTH, width - 70));
  }, [width]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 310 : 255,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const drawerTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const mainTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drawerWidth],
  });

  const visibleMainWidth = Math.max(width - drawerWidth, 70);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.mainScreen, { transform: [{ translateX: mainTranslateX }] }]}>
        {children}
      </Animated.View>

      {open ? <Pressable style={[styles.peekCloseArea, { width: visibleMainWidth }]} onPress={onClose} /> : null}

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            transform: [{ translateX: drawerTranslateX }],
          },
        ]}
      >
        <View style={styles.drawerInner}>
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
                icon={sidebarIcon(<Home size={26} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                label="Home"
                onPress={onClose}
              />
              <SidebarItem
                icon={sidebarIcon(<SquarePen size={25} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                label="New chat"
                onPress={onNewChat}
              />
              <SidebarItem
                icon={sidebarIcon(<BookOpen size={26} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                label="Study modes"
              />
              <SidebarItem
                icon={sidebarIcon(<Folder size={27} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />)}
                label="Projects"
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

          <View style={styles.bottomBar}>
            <Pressable style={({ pressed }) => [styles.profileInline, pressed && styles.pressed]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
              <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
            </Pressable>

            <Pressable onPress={onNewChat} style={({ pressed }) => [styles.composeButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Start a new chat">
              <SquarePen size={26} color={SIDEBAR_ICON_COLOR} strokeWidth={1.85} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

type SidebarItemProps = {
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
};

function SidebarItem({ icon, label, onPress }: SidebarItemProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={label}>
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
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#fbfbfa',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 14, height: 0 },
    elevation: 12,
  },
  drawerInner: {
    flex: 1,
    paddingTop: 92,
    paddingHorizontal: 36,
    paddingBottom: 24,
  },
  topBar: {
    flexShrink: 0,
    paddingBottom: 50,
    backgroundColor: '#fbfbfa',
  },
  brand: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 40,
    lineHeight: 47,
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 6,
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
    paddingBottom: 18,
  },
  primaryNav: {
    gap: 29,
  },
  navItem: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
  },
  navIconSlot: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.18,
  },
  pressed: {
    opacity: 0.58,
  },
  divider: {
    height: 1,
    marginTop: 42,
    marginBottom: 30,
    backgroundColor: 'rgba(17,24,39,0.075)',
  },
  recentList: {
    gap: 20,
  },
  recentRow: {
    minHeight: 42,
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
    fontSize: 16.6,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.15,
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
    minHeight: 64,
    paddingTop: 14,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    backgroundColor: '#fbfbfa',
  },
  profileInline: {
    width: 162,
    minHeight: 56,
    paddingLeft: 10,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    shadowColor: '#111827',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cf8230',
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
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.055)',
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 3,
  },
});
