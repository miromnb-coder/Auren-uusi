import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type AurenPlusSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCamera?: () => void;
  onPhotos?: () => void;
  onFiles?: () => void;
  onCreateFlashcards?: () => void;
  onSummarizeNotes?: () => void;
  onExplainTask?: () => void;
  onExplainFromImage?: () => void;
  onStartStudySession?: () => void;
};

type TileAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type SheetAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type Connector = {
  label: string;
  mark: string;
  markStyle: 'drive' | 'notion' | 'onedrive';
};

const TOP_ACTIONS = (props: AurenPlusSheetProps): TileAction[] => [
  { label: 'Camera', icon: 'camera-outline', onPress: props.onCamera },
  { label: 'Photos', icon: 'images-outline', onPress: props.onPhotos },
  { label: 'Files', icon: 'document-outline', onPress: props.onFiles },
];

const STUDY_ACTIONS = (props: AurenPlusSheetProps): SheetAction[] => [
  { label: 'Create flashcards', icon: 'copy-outline', onPress: props.onCreateFlashcards },
  { label: 'Summarize notes', icon: 'reorder-three-outline', onPress: props.onSummarizeNotes },
  { label: 'Explain task', icon: 'scan-outline', onPress: props.onExplainTask },
  { label: 'Explain from image', icon: 'image-outline', onPress: props.onExplainFromImage },
  { label: 'Start study session', icon: 'time-outline', onPress: props.onStartStudySession },
];

const CONNECTORS: Connector[] = [
  { label: 'Google Drive', mark: '△', markStyle: 'drive' },
  { label: 'Notion', mark: 'N', markStyle: 'notion' },
  { label: 'OneDrive', mark: '☁', markStyle: 'onedrive' },
];

const SHEET_BACKGROUND = '#fbfaf7';
const TILE_BACKGROUND = 'rgba(245,242,237,0.82)';
const ICON_COLOR = 'rgba(25,25,27,0.84)';
const CHEVRON_COLOR = 'rgba(55,55,58,0.34)';

const CLOSE_DISTANCE = 92;
const CLOSE_VELOCITY = 0.85;
const DRAG_ACTIVATION_DISTANCE = 7;

export function AurenPlusSheet(props: AurenPlusSheetProps) {
  const { visible, onClose } = props;
  const insets = useSafeAreaInsets();

  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const scrollYRef = useRef(0);

  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragTranslateY.setValue(0);
      scrollYRef.current = 0;
    }

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        dragTranslateY.setValue(0);
        setMounted(false);
      }
    });
  }, [dragTranslateY, progress, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,

        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const isAtTop = scrollYRef.current <= 0;
          const isPullingDown = gesture.dy > DRAG_ACTIVATION_DISTANCE;
          const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;

          return visible && isAtTop && isPullingDown && isMostlyVertical;
        },

        onMoveShouldSetPanResponder: (_, gesture) => {
          const isAtTop = scrollYRef.current <= 0;
          const isPullingDown = gesture.dy > DRAG_ACTIVATION_DISTANCE;
          const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;

          return visible && isAtTop && isPullingDown && isMostlyVertical;
        },

        onPanResponderMove: (_, gesture) => {
          const nextY = Math.max(0, gesture.dy);
          dragTranslateY.setValue(nextY);
        },

        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > CLOSE_DISTANCE || gesture.vy > CLOSE_VELOCITY;

          if (shouldClose) {
            onClose();
            return;
          }

          Animated.spring(dragTranslateY, {
            toValue: 0,
            tension: 95,
            friction: 13,
            useNativeDriver: true,
          }).start();
        },

        onPanResponderTerminate: () => {
          Animated.spring(dragTranslateY, {
            toValue: 0,
            tension: 95,
            friction: 13,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragTranslateY, onClose, visible],
  );

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.47],
  });

  const baseSheetTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [900, 0],
  });

  const sheetTranslateY = Animated.add(baseSheetTranslateY, dragTranslateY);

  if (!mounted) {
    return null;
  }

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom + 8, 24),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          onScroll={(event) => {
            scrollYRef.current = Math.max(0, event.nativeEvent.contentOffset.y);
          }}
        >
          <View style={styles.tileRow}>
            {TOP_ACTIONS(props).map((action) => (
              <TopTile key={action.label} action={action} />
            ))}
          </View>

          <View style={styles.actionList}>
            {STUDY_ACTIONS(props).map((action) => (
              <ActionRow key={action.label} action={action} />
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Connectors</Text>

          <View style={styles.connectorsList}>
            {CONNECTORS.map((connector) => (
              <ConnectorRow key={connector.label} connector={connector} />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function TopTile({ action }: { action: TileAction }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      style={({ pressed }) => [styles.topTile, pressed && styles.pressed]}
    >
      <Ionicons name={action.icon} size={30} color={ICON_COLOR} />
      <Text style={styles.topTileLabel}>{action.label}</Text>
    </Pressable>
  );
}

function ActionRow({ action }: { action: SheetAction }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
    >
      <View style={styles.actionIconSlot}>
        <Ionicons name={action.icon} size={29} color={ICON_COLOR} />
      </View>

      <Text style={styles.actionLabel}>{action.label}</Text>

      <Ionicons name="chevron-forward" size={24} color={CHEVRON_COLOR} />
    </Pressable>
  );
}

function ConnectorRow({ connector }: { connector: Connector }) {
  return (
    <View style={styles.connectorRow}>
      <View style={[styles.connectorMark, styles[connector.markStyle]]}>
        <Text style={[styles.connectorMarkText, connector.markStyle === 'drive' && styles.driveText]}>
          {connector.mark}
        </Text>
      </View>

      <Text style={styles.connectorLabel}>{connector.label}</Text>

      <Pressable style={({ pressed }) => [styles.connectButton, pressed && styles.pressed]}>
        <Text style={styles.connectButtonText}>Connect</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: SHEET_BACKGROUND,
    shadowColor: '#111827',
    shadowOpacity: 0.13,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -12 },
    elevation: 18,
  },

  handle: {
    alignSelf: 'center',
    width: 62,
    height: 8,
    borderRadius: 999,
    marginTop: 19,
    marginBottom: 24,
    backgroundColor: 'rgba(37,37,38,0.23)',
  },

  scrollContent: {
    paddingHorizontal: 31,
    paddingBottom: 8,
  },

  tileRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 26,
  },

  topTile: {
    flex: 1,
    height: 145,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TILE_BACKGROUND,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
  },

  topTileLabel: {
    marginTop: 15,
    color: colors.text,
    fontSize: 18.2,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },

  actionList: {
    gap: 0,
  },

  actionRow: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIconSlot: {
    width: 49,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  actionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 18.7,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -0.24,
  },

  pressed: {
    opacity: 0.58,
  },

  divider: {
    height: 1,
    marginTop: 14,
    marginBottom: 20,
    backgroundColor: 'rgba(17,24,39,0.105)',
  },

  sectionTitle: {
    color: 'rgba(67,68,74,0.82)',
    fontSize: 18.4,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -0.18,
    marginBottom: 16,
  },

  connectorsList: {
    gap: 4,
  },

  connectorRow: {
    minHeight: 63,
    flexDirection: 'row',
    alignItems: 'center',
  },

  connectorMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 17,
  },

  drive: {
    backgroundColor: 'rgba(52,168,83,0.08)',
  },

  notion: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.12)',
  },

  onedrive: {
    backgroundColor: 'rgba(0,120,212,0.1)',
  },

  connectorMarkText: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
  },

  driveText: {
    color: '#2f8f4e',
    fontSize: 25,
  },

  connectorLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 18.5,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  connectButton: {
    minWidth: 102,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.065)',
  },

  connectButtonText: {
    color: colors.text,
    fontSize: 16.3,
    lineHeight: 20,
    fontWeight: Platform.select({ ios: '500', android: '500', default: '500' }),
    letterSpacing: -0.14,
  },
});
