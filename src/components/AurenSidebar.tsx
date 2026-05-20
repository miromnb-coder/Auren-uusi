import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
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

const DRAWER_WIDTH_RATIO = 0.78;
const DRAWER_MIN_WIDTH = 292;
const DRAWER_MAX_WIDTH = 420;
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

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
    return Math.min(Math.max(measuredWidth, DRAWER_MIN_WIDTH), Math.min(DRAWER_MAX_WIDTH, width - 74));
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

  const visibleMainWidth = Math.max(width - drawerWidth, 74);

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
              <SidebarItem icon="home-outline" label="Home" onPress={onClose} />
              <SidebarItem variant="compose" label="New chat" onPress={onNewChat} />
              <SidebarItem icon="book-outline" label="Study modes" />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Recent chats</Text>
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
                      <Ionicons name="chevron-forward-outline" size={20} color={isActive ? '#81858f' : '#969aa5'} />
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
              <Ionicons name="chevron-down-outline" size={19} color="#858792" />
            </Pressable>

            <Pressable onPress={onNewChat} style={({ pressed }) => [styles.composeButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Start a new chat">
              <AurenComposeGlyph size={31} color="#0f1115" />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

type SidebarItemProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  variant?: 'compose';
};

function SidebarItem({ icon, label, onPress, variant }: SidebarItemProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.navIconSlot}>
        {variant === 'compose' ? (
          <AurenComposeGlyph size={27} color={colors.icon} />
        ) : icon ? (
          <Ionicons name={icon} size={27} color={colors.icon} />
        ) : null}
      </View>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

type AurenComposeGlyphProps = {
  size?: number;
  color?: string;
};

function AurenComposeGlyph({ size = 28, color = colors.icon }: AurenComposeGlyphProps) {
  return <Feather name="edit-3" size={size} color={color} strokeWidth={2.35} />;
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
    shadowOpacity: 0.11,
    shadowRadius: 28,
    shadowOffset: { width: 16, height: 0 },
    elevation: 12,
  },
  drawerInner: {
    flex: 1,
    paddingTop: 92,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  topBar: {
    flexShrink: 0,
    paddingBottom: 44,
    backgroundColor: '#fbfbfa',
  },
  brand: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 35,
    lineHeight: 41,
    letterSpacing: -1.05,
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  primaryNav: {
    gap: 25,
  },
  navItem: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navIconSlot: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: colors.text,
    fontSize: 18.5,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  pressed: {
    opacity: 0.58,
  },
  divider: {
    height: 1,
    marginTop: 36,
    marginBottom: 28,
    backgroundColor: 'rgba(17,24,39,0.08)',
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.13,
  },
  recentList: {
    marginTop: 20,
    gap: 17,
  },
  recentRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 17,
    paddingLeft: 18,
    paddingRight: 14,
    marginHorizontal: -6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0)',
  },
  activeRecentRow: {
    backgroundColor: 'rgba(247,246,243,0.88)',
    borderColor: 'rgba(17,24,39,0.035)',
    shadowColor: '#111827',
    shadowOpacity: 0.018,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1,
  },
  recentTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17.2,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
    paddingRight: 12,
  },
  activeRecentTitle: {
    color: '#12151c',
    fontWeight: '500',
  },
  emptyRecentText: {
    color: colors.muted,
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: -0.13,
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
    minWidth: 152,
    maxWidth: 228,
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 18.5,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
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
