import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../theme';

type AurenSidebarProps = {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
  onNewChat?: () => void;
};

const DRAWER_WIDTH_RATIO = 0.78;
const DRAWER_MIN_WIDTH = 292;
const DRAWER_MAX_WIDTH = 420;
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const recentChats = [
  'Vegan dinner ideas',
  'Photosynthesis explained',
  'Quiz me on biology',
  'Math homework help',
  'Study plan for exams',
];

export function AurenSidebar({ open, children, onClose, onNewChat }: AurenSidebarProps) {
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
          <View style={styles.brandArea}>
            <Text style={styles.brand}>Auren</Text>
            <Text style={styles.subtitle}>Your study assistant</Text>
          </View>

          <View style={styles.primaryNav}>
            <SidebarItem icon="home-outline" label="Home" />
            <SidebarItem icon="chatbubble-ellipses-outline" label="New chat" onPress={onNewChat} />
            <SidebarItem icon="book-outline" label="Study modes" />
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Recent chats</Text>
            <View style={styles.recentList}>
              {recentChats.map((chat) => (
                <Pressable key={chat} style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{chat}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.dividerLower} />

            <View style={styles.secondaryNav}>
              <SidebarItem icon="bookmark-outline" label="Saved" />
              <SidebarItem icon="settings-outline" label="Settings" />
              <SidebarItem icon="help-circle-outline" label="Help & feedback" />
            </View>
          </ScrollView>

          <View style={styles.bottomArea}>
            <Pressable style={({ pressed }) => [styles.profilePill, pressed && styles.pressed]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>M</Text>
              </View>
              <Text style={styles.profileName}>Miro</Text>
              <Ionicons name="chevron-down-outline" size={18} color="#858792" />
            </Pressable>

            <Pressable onPress={onNewChat} style={({ pressed }) => [styles.composeButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Start a new chat">
              <Ionicons name="pencil-outline" size={26} color={colors.icon} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

type SidebarItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
};

function SidebarItem({ icon, label, onPress }: SidebarItemProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={26} color={colors.icon} />
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
    shadowOpacity: 0.11,
    shadowRadius: 28,
    shadowOffset: { width: 16, height: 0 },
    elevation: 12,
  },
  drawerInner: {
    flex: 1,
    paddingTop: 92,
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  brandArea: {
    marginBottom: 50,
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
  primaryNav: {
    gap: 25,
  },
  navItem: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 26,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.13,
  },
  recentList: {
    marginTop: 25,
    gap: 29,
  },
  recentRow: {
    minHeight: 27,
    justifyContent: 'center',
  },
  recentTitle: {
    color: colors.text,
    fontSize: 17.5,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  dividerLower: {
    height: 1,
    marginTop: 32,
    marginBottom: 28,
    backgroundColor: 'rgba(17,24,39,0.08)',
  },
  secondaryNav: {
    gap: 24,
  },
  bottomArea: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  profilePill: {
    height: 54,
    minWidth: 156,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingLeft: 13,
    paddingRight: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    shadowColor: '#111827',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cf8230',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  profileName: {
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
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    shadowColor: '#111827',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
