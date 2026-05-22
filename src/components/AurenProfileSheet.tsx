import { Brain, ChevronRight, HelpCircle, LogOut, Moon, Settings, User } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type AurenProfileSheetProps = {
  visible: boolean;
  profileName: string;
  avatarLetter: string;
  onClose: () => void;
};

type ProfileRowProps = {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  last?: boolean;
  onPress?: () => void;
};

const SHEET_BACKGROUND = colors.background;
const CARD_BACKGROUND = 'rgba(255,255,255,0.42)';
const CARD_BORDER = 'rgba(17,24,39,0.075)';
const DIVIDER = 'rgba(17,24,39,0.085)';
const DANGER = '#b9354b';
const ICON_COLOR = 'rgba(17,24,39,0.88)';
const HANDLE_COLOR = 'rgba(17,24,39,0.42)';

export function AurenProfileSheet({ visible, profileName, avatarLetter, onClose }: AurenProfileSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const sheetHeight = useMemo(() => Math.max(570, Math.min(height * 0.71, height - 244)), [height]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 310 : 255,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
      }
    });
  }, [progress, visible]);

  if (!mounted) {
    return null;
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight + 40, 0],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[styles.backdropTint, { opacity: backdropOpacity }]} />
        <Pressable style={styles.backdropPressArea} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 18) + 10,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profileName}
              </Text>
              <Text style={styles.profileSubtitle}>Personal account</Text>
            </View>
          </View>

          <View style={styles.groupCard}>
            <ProfileRow icon={<User size={27} color={ICON_COLOR} strokeWidth={1.8} />} label="Account" />
            <ProfileRow icon={<Moon size={28} color={ICON_COLOR} strokeWidth={1.8} />} label="Appearance" />
            <ProfileRow icon={<Brain size={29} color={ICON_COLOR} strokeWidth={1.75} />} label="Memory" />
            <ProfileRow icon={<Settings size={29} color={ICON_COLOR} strokeWidth={1.8} />} label="Settings" />
            <ProfileRow icon={<HelpCircle size={29} color={ICON_COLOR} strokeWidth={1.8} />} label="Help" last />
          </View>

          <View style={styles.signOutCard}>
            <ProfileRow icon={<LogOut size={29} color={DANGER} strokeWidth={1.8} />} label="Sign out" danger last />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ProfileRow({ icon, label, danger = false, last = false, onPress }: ProfileRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.rowContent}>
        <View style={styles.iconSlot}>{icon}</View>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
        <ChevronRight size={28} color={danger ? DANGER : ICON_COLOR} strokeWidth={1.75} />
      </View>
      {!last ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247,247,245,0.08)',
  },
  backdropPressArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 31,
    borderTopRightRadius: 31,
    backgroundColor: SHEET_BACKGROUND,
    paddingTop: 26,
    paddingHorizontal: 26,
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: -18 },
    elevation: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 70,
    height: 7,
    borderRadius: 999,
    backgroundColor: HANDLE_COLOR,
  },
  profileHeader: {
    marginTop: 51,
    marginBottom: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 27,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d89437',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.36,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: colors.text,
    fontSize: 22.5,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: -0.68,
  },
  profileSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 15.6,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.15,
  },
  groupCard: {
    overflow: 'hidden',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BACKGROUND,
  },
  signOutCard: {
    overflow: 'hidden',
    marginTop: 20,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BACKGROUND,
  },
  row: {
    minHeight: 64,
    backgroundColor: 'transparent',
  },
  rowPressed: {
    backgroundColor: 'rgba(17,24,39,0.035)',
  },
  rowContent: {
    flex: 1,
    minHeight: 64,
    paddingLeft: 31,
    paddingRight: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    marginLeft: 22,
    color: colors.text,
    fontSize: 18.2,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  dangerText: {
    color: DANGER,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 31,
    marginRight: 34,
    backgroundColor: DIVIDER,
  },
});
