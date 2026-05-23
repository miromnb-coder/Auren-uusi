import { MoreHorizontal, Share2, Sparkles } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type AurenHeaderProps = {
  onOpenMenu?: () => void;
  showCreditsBadge?: boolean;
  showConversationActions?: boolean;
  credits?: number;
  onShareConversation?: () => void;
  onOpenConversationMenu?: () => void;
};

export function AurenHeader({
  onOpenMenu,
  showCreditsBadge = false,
  showConversationActions = false,
  credits = 300,
  onShareConversation,
  onOpenConversationMenu,
}: AurenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </Pressable>

      <Text style={styles.title}>Auren</Text>

      <View style={styles.rightSlot}>
        {showCreditsBadge ? (
          <View style={styles.creditsBadge}>
            <Sparkles size={20} color={colors.text} strokeWidth={1.85} />
            <Text style={styles.creditsText}>{credits}</Text>
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 82,
    paddingLeft: 14,
    paddingRight: 13,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  menuButton: {
    width: 58,
    height: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
  },
  menuButtonPressed: {
    opacity: 0.58,
  },
  menuLine: {
    width: 25,
    height: 2.2,
    borderRadius: 999,
    backgroundColor: '#72737c',
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
    zIndex: 2,
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
});
