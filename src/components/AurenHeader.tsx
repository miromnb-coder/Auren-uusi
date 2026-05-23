import { ArrowUpRight, CalendarDays, ChevronRight, Clock3, MoreHorizontal, Share2, Sparkles, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const MENU_ICON_COLOR = 'rgba(17,24,39,0.78)';
const CREDIT_ACCENT = '#54506f';
const CREDIT_MUTED = 'rgba(84,80,111,0.62)';

type AurenHeaderProps = {
  onOpenMenu?: () => void;
  showCreditsBadge?: boolean;
  showConversationActions?: boolean;
  credits?: number;
  creditsDismissKey?: number;
  onShareConversation?: () => void;
  onOpenConversationMenu?: () => void;
};

export function AurenHeader({
  onOpenMenu,
  showCreditsBadge = false,
  showConversationActions = false,
  credits = 300,
  creditsDismissKey = 0,
  onShareConversation,
  onOpenConversationMenu,
}: AurenHeaderProps) {
  const [creditsOpen, setCreditsOpen] = useState(false);

  useEffect(() => {
    setCreditsOpen(false);
  }, [creditsDismissKey]);

  useEffect(() => {
    if (!showCreditsBadge) {
      setCreditsOpen(false);
    }
  }, [showCreditsBadge]);

  function toggleCreditsOpen() {
    setCreditsOpen((current) => !current);
  }

  function closeCreditsOpen() {
    setCreditsOpen(false);
  }

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        hitSlop={{ top: 18, right: 22, bottom: 18, left: 14 }}
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
        <View style={styles.menuIcon}>
          <View style={styles.menuLineTop} />
          <View style={styles.menuLineBottom} />
        </View>
      </Pressable>

      <Text pointerEvents="none" style={styles.title}>Auren</Text>

      <View style={styles.rightSlot}>
        {showCreditsBadge ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open credits usage"
            onPress={toggleCreditsOpen}
            style={({ pressed }) => [styles.creditsBadge, pressed && styles.menuButtonPressed]}
          >
            <Sparkles size={20} color={colors.text} strokeWidth={1.85} />
            <Text style={styles.creditsText}>{credits}</Text>
          </Pressable>
        ) : showConversationActions ? (
          <View style={styles.conversationActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share conversation"
              onPress={onShareConversation}
              style={({ pressed }) => [styles.actionButton, pressed && styles.menuButtonPressed]}
            >
              <Share2 size={23} color={colors.text} strokeWidth={1.85} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Conversation options"
              onPress={onOpenConversationMenu}
              style={({ pressed }) => [styles.actionButton, pressed && styles.menuButtonPressed]}
            >
              <MoreHorizontal size={26} color={colors.text} strokeWidth={1.9} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {showCreditsBadge && creditsOpen ? (
        <>
          <Pressable style={styles.creditsDismissLayer} onPress={closeCreditsOpen} />
          <CreditsPopover credits={credits} />
        </>
      ) : null}
    </View>
  );
}

type UsageRowProps = {
  label: string;
  value: string;
  progress: number;
};

function CreditsPopover({ credits }: { credits: number }) {
  return (
    <View pointerEvents="box-none" style={styles.creditsPopoverWrap}>
      <View style={styles.creditsPopoverPointer} />
      <View style={styles.creditsPopover}>
        <Text style={styles.popoverTitle}>Credits</Text>
        <Text style={styles.popoverSubtitle}>Usage and balance</Text>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceNumber}>{credits}</Text>
          <Text style={styles.balanceLabel}>available</Text>
        </View>

        <View style={styles.popoverDivider} />

        <View style={styles.dailyAllowanceRow}>
          <View style={styles.dailyIconBubble}>
            <CalendarDays size={13} color={CREDIT_ACCENT} strokeWidth={1.9} />
          </View>
          <Text style={styles.dailyAllowanceText}>Daily credits: 40/day</Text>
        </View>

        <UsageRow label="Used today" value="24 / 40" progress={0.6} />

        <View style={styles.dailyPill}>
          <Text style={styles.dailyPillText}>+40 credits every day</Text>
        </View>

        <UsageRow label="Used this week" value="96" progress={0.57} />
        <UsageRow label="Used this month" value="214 / 500" progress={0.43} />

        <View style={styles.refillRow}>
          <Clock3 size={14} color={CREDIT_MUTED} strokeWidth={1.8} />
          <Text style={styles.refillText}>Daily refill in 5 hours</Text>
        </View>

        <View style={styles.popoverDividerCompact} />

        <View style={styles.planRow}>
          <View style={styles.planLeft}>
            <User size={17} color={colors.text} strokeWidth={1.8} />
            <Text style={styles.planText}>Plan: Free</Text>
          </View>
          <View style={styles.freePill}>
            <Text style={styles.freePillText}>Free</Text>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.upgradeRow, pressed && styles.upgradePressed]} accessibilityRole="button" accessibilityLabel="Upgrade for more credits">
          <View style={styles.planLeft}>
            <ArrowUpRight size={18} color={colors.text} strokeWidth={1.8} />
            <Text style={styles.planText}>Upgrade for more</Text>
          </View>
          <ChevronRight size={20} color={colors.text} strokeWidth={1.8} />
        </Pressable>
      </View>
    </View>
  );
}

function UsageRow({ label, value, progress }: UsageRowProps) {
  return (
    <View style={styles.usageBlock}>
      <View style={styles.usageLabelRow}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={styles.usageValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(2, Math.min(progress, 1) * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 82,
    paddingLeft: 13,
    paddingRight: 13,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    zIndex: 30,
    overflow: 'visible',
  },
  menuButton: {
    width: 62,
    height: 62,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 3,
  },
  menuButtonPressed: {
    opacity: 0.58,
  },
  menuIcon: {
    width: 31,
    height: 22,
    justifyContent: 'center',
    gap: 8,
  },
  menuLineTop: {
    width: 29,
    height: 3.2,
    borderRadius: 999,
    backgroundColor: MENU_ICON_COLOR,
  },
  menuLineBottom: {
    width: 20,
    height: 3.2,
    borderRadius: 999,
    backgroundColor: MENU_ICON_COLOR,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignSelf: 'center',
    color: colors.text,
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.9,
    fontFamily: serifFont,
    textAlign: 'center',
  },
  rightSlot: {
    width: 104,
    height: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 32,
  },
  creditsBadge: {
    minWidth: 82,
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,24,39,0.18)',
    backgroundColor: 'rgba(255,255,255,0.52)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  creditsText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.18,
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  creditsDismissLayer: {
    position: 'absolute',
    top: 82,
    left: -13,
    right: -13,
    height: 1200,
    zIndex: 35,
    backgroundColor: 'transparent',
  },
  creditsPopoverWrap: {
    position: 'absolute',
    top: 68,
    right: 12,
    width: 292,
    zIndex: 40,
    alignItems: 'stretch',
  },
  creditsPopoverPointer: {
    position: 'absolute',
    top: -8,
    right: 47,
    width: 18,
    height: 18,
    borderTopLeftRadius: 4,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,24,39,0.1)',
    zIndex: 1,
  },
  creditsPopover: {
    overflow: 'hidden',
    borderRadius: 17,
    paddingTop: 18,
    paddingHorizontal: 23,
    paddingBottom: 17,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,24,39,0.1)',
    shadowColor: '#111827',
    shadowOpacity: 0.13,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  popoverTitle: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.22,
  },
  popoverSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  balanceRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  balanceNumber: {
    color: colors.text,
    fontSize: 43,
    lineHeight: 49,
    fontWeight: '700',
    letterSpacing: -1.45,
  },
  balanceLabel: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.16,
  },
  popoverDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 17,
    marginBottom: 17,
    backgroundColor: 'rgba(17,24,39,0.1)',
  },
  popoverDividerCompact: {
    height: StyleSheet.hairlineWidth,
    marginTop: 15,
    marginBottom: 12,
    backgroundColor: 'rgba(17,24,39,0.1)',
  },
  dailyAllowanceRow: {
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  dailyIconBubble: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(84,80,111,0.1)',
  },
  dailyAllowanceText: {
    color: colors.text,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.12,
  },
  usageBlock: {
    marginTop: 13,
  },
  usageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  usageLabel: {
    color: colors.text,
    fontSize: 13.8,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  usageValue: {
    color: CREDIT_ACCENT,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  progressTrack: {
    overflow: 'hidden',
    height: 5.5,
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(84,80,111,0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: CREDIT_ACCENT,
  },
  dailyPill: {
    alignSelf: 'flex-start',
    marginTop: 13,
    marginBottom: 4,
    paddingHorizontal: 12,
    height: 31,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(84,80,111,0.08)',
  },
  dailyPillText: {
    color: CREDIT_ACCENT,
    fontSize: 13.2,
    lineHeight: 17,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  refillRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refillText: {
    color: colors.muted,
    fontSize: 13.2,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  planRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeRow: {
    minHeight: 36,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradePressed: {
    opacity: 0.62,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
  },
  planText: {
    color: colors.text,
    fontSize: 14.6,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  freePill: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,24,39,0.11)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  freePillText: {
    color: colors.text,
    fontSize: 13.2,
    lineHeight: 17,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
});
