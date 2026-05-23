import { Folder, FolderPlus, Library, Search, SquarePen, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AurenProfileSheet } from './AurenProfileSheet';
import type { AurenConversation } from '../lib/aurenConversations';
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
  activeConversationId?: string | null;
  activeItem?: ActiveSidebarItem;
  profileName?: string;
  avatarLetter?: string;
  loadingConversations?: boolean;
  onSelectConversation?: (conversationId: string) => void;
  onRenameConversation?: (conversation: AurenConversation, title: string) => Promise<void> | void;
  onDeleteConversation?: (conversation: AurenConversation) => Promise<void> | void;
};

const SIDEBAR_ICON_COLOR = 'rgba(15,17,21,0.88)';
const ICON_STROKE_WIDTH = 1.78;
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

export function AurenSidebar({
  open,
  children,
  onClose,
  onOpen,
  onNewChat,
  onSearchChats,
  onProjects,
  onNewProject,
  conversations = [],
  activeConversationId = null,
  activeItem = null,
  profileName = 'Auren user',
  avatarLetter = 'A',
  loadingConversations = false,
  onSelectConversation,
}: AurenSidebarProps) {
  const { width } = useWindowDimensions();
  const drawerProgress = useSharedValue(open ? 1 : 0);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  useEffect(() => {
    drawerProgress.value = withTiming(open ? 1 : 0, {
      duration: open ? 310 : 255,
      easing: Easing.out(Easing.cubic),
    });
  }, [drawerProgress, open]);

  useEffect(() => {
    if (open) onOpen?.();
  }, [onOpen, open]);

  function handleNewProject() {
    void aurenHaptics.selection();
    onNewProject?.();
  }

  function openSearchChats() {
    void aurenHaptics.selection();
    onSearchChats?.();
  }

  function openProfileSheet() {
    void aurenHaptics.panelOpen();
    setProfileSheetOpen(true);
  }

  function closeProfileSheet() {
    void aurenHaptics.panelClose();
    setProfileSheetOpen(false);
  }

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerProgress.value * width }],
  }));

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width + drawerProgress.value * width }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.mainScreen, mainAnimatedStyle]}>{children}</Animated.View>

      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.drawer, drawerAnimatedStyle, { width }]}>
        <View style={styles.drawerInner}>
          <View style={styles.headerRow}>
            <Text style={styles.brand}>Auren</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Close menu">
              <X size={31} color="rgba(15,17,21,0.9)" strokeWidth={1.7} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
            <View style={styles.primaryNav}>
              <SidebarItem icon={<SquarePen size={30} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />} label="New chat" onPress={onNewChat} active={activeItem === 'newChat'} />
              <SidebarItem icon={<Folder size={31} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />} label="Projects" onPress={onProjects} active={activeItem === 'projects'} />
              <SidebarItem icon={<FolderPlus size={31} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />} label="New project" onPress={handleNewProject} />
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
                      <Pressable key={chat.id} onPress={() => onSelectConversation?.(chat.id)} style={({ pressed }) => [styles.recentRow, isActive && styles.activeRecentRow, pressed && styles.pressedRecentRow]}>
                        <Text style={[styles.recentTitle, isActive && styles.activeRecentTitle]} numberOfLines={1}>{chat.title}</Text>
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
            <Pressable onPress={openProfileSheet} style={({ pressed }) => [styles.profileInline, pressed && styles.profilePressed]} accessibilityRole="button" accessibilityLabel="Open profile settings">
              <View style={styles.avatar}><Text style={styles.avatarText}>{avatarLetter}</Text></View>
              <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
            </Pressable>

            <View style={styles.bottomActions}>
              <Pressable style={({ pressed }) => [styles.bottomIconButton, pressed && styles.iconPressed]} accessibilityRole="button" accessibilityLabel="Library">
                <Library size={25} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />
              </Pressable>
              <Pressable onPress={openSearchChats} style={({ pressed }) => [styles.bottomIconButton, pressed && styles.iconPressed]} accessibilityRole="button" accessibilityLabel="Search chats">
                <Search size={27} color={SIDEBAR_ICON_COLOR} strokeWidth={ICON_STROKE_WIDTH} />
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>

      <AurenProfileSheet visible={profileSheetOpen} profileName={profileName} avatarLetter={avatarLetter} onClose={closeProfileSheet} />
    </View>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navItem, active && styles.activeNavItem, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.navIconSlot}>{icon}</View>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: colors.background },
  mainScreen: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 20, backgroundColor: colors.background },
  drawerInner: { flex: 1, paddingTop: 66, paddingBottom: 20 },
  headerRow: { height: 50, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.text, fontFamily: serifFont, fontSize: 34, lineHeight: 40, letterSpacing: -0.98 },
  closeButton: { width: 50, height: 50, marginRight: -5, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, marginTop: 12 },
  scrollContent: { paddingBottom: 34 },
  primaryNav: { paddingHorizontal: 32, gap: 12 },
  navItem: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 22 },
  activeNavItem: { minHeight: 66, marginBottom: 4, paddingHorizontal: 16, marginHorizontal: -4, borderRadius: 30, backgroundColor: 'rgba(17,24,39,0.035)' },
  navIconSlot: { width: 38, alignItems: 'center', justifyContent: 'center' },
  navLabel: { color: colors.text, fontSize: 20.2, lineHeight: 26, fontWeight: '400', letterSpacing: -0.32 },
  pressed: { opacity: 0.58 },
  recentSection: { marginTop: 30, paddingHorizontal: 32 },
  recentHeader: { color: colors.muted, fontSize: 16.8, lineHeight: 22, fontWeight: '400', letterSpacing: -0.22 },
  recentList: { marginTop: 18, gap: 13 },
  recentRow: { minHeight: 39, flexDirection: 'row', alignItems: 'center', borderRadius: 0, paddingRight: 8 },
  activeRecentRow: { minHeight: 44, marginLeft: -12, paddingLeft: 12, borderRadius: 22, backgroundColor: 'rgba(17,24,39,0.035)' },
  pressedRecentRow: { minHeight: 44, marginLeft: -12, paddingLeft: 12, paddingRight: 12, borderRadius: 22, backgroundColor: 'rgba(17,24,39,0.045)', transform: [{ scale: 0.996 }] },
  recentTitle: { flex: 1, color: colors.text, fontSize: 17.7, lineHeight: 23, fontWeight: '400', letterSpacing: -0.18 },
  activeRecentTitle: { color: colors.text, fontWeight: '400' },
  emptyRecentText: { color: colors.muted, fontSize: 16, lineHeight: 22, fontWeight: '400', letterSpacing: -0.14 },
  bottomBar: { flexShrink: 0, minHeight: 70, paddingTop: 12, paddingBottom: 2, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.background },
  profileInline: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 22 },
  profilePressed: { opacity: 0.62, transform: [{ scale: 0.99 }] },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#d89437' },
  avatarText: { color: '#ffffff', fontSize: 17.5, lineHeight: 21, fontWeight: '700' },
  profileName: { flexShrink: 1, color: colors.text, fontSize: 18.8, lineHeight: 25, fontWeight: '400', letterSpacing: -0.22 },
  bottomActions: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 15 },
  bottomIconButton: { width: 34, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  iconPressed: { opacity: 0.54, transform: [{ scale: 0.96 }] },
});
