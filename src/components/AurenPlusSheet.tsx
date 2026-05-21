import Ionicons from '@expo/vector-icons/Ionicons';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Animated,
  Easing,
  Image,
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

type SheetAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type Connector = {
  label: string;
  icon: ImageSourcePropType;
};

type RecentPhoto = {
  id: string;
  uri: string;
};

const STUDY_ACTIONS = (props: AurenPlusSheetProps): SheetAction[] => [
  { label: 'Create flashcards', icon: 'copy-outline', onPress: props.onCreateFlashcards },
  { label: 'Summarize notes', icon: 'reorder-three-outline', onPress: props.onSummarizeNotes },
  { label: 'Explain task', icon: 'scan-outline', onPress: props.onExplainTask },
  { label: 'Explain from image', icon: 'image-outline', onPress: props.onExplainFromImage },
  { label: 'Start study session', icon: 'time-outline', onPress: props.onStartStudySession },
];

const CONNECTORS: Connector[] = [
  { label: 'Google Drive', icon: require('../assets/connectors/google-drive.PNG') },
  { label: 'Gmail', icon: require('../assets/connectors/gmail.PNG') },
  { label: 'Google Calendar', icon: require('../assets/connectors/google-calendar.PNG') },
  { label: 'Outlook Calendar', icon: require('../assets/connectors/outlook-calendar.PNG') },
  { label: 'Outlook Mail', icon: require('../assets/connectors/outlook-mail.PNG') },
];

const SHEET_BACKGROUND = '#fbfaf7';
const PHOTO_CARD_BACKGROUND = 'rgba(245,242,237,0.82)';
const ICON_COLOR = 'rgba(25,25,27,0.84)';
const CHEVRON_COLOR = 'rgba(55,55,58,0.34)';

const CLOSE_DISTANCE = 92;
const CLOSE_VELOCITY = 0.85;
const DRAG_ACTIVATION_DISTANCE = 7;

function isRenderableImageUri(uri?: string | null) {
  if (!uri) return false;

  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('asset://') ||
    uri.startsWith('data:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
  );
}

export function AurenPlusSheet(props: AurenPlusSheetProps) {
  const { visible, onClose } = props;
  const insets = useSafeAreaInsets();

  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const scrollYRef = useRef(0);

  const [mounted, setMounted] = useState(visible);
  const [recentPhotos, setRecentPhotos] = useState<RecentPhoto[]>([]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragTranslateY.setValue(0);
      scrollYRef.current = 0;
      loadRecentPhotos();
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

  async function loadRecentPhotos() {
    try {
      const currentPermission = await MediaLibrary.getPermissionsAsync();
      let hasPermission = currentPermission.granted;

      if (!hasPermission && currentPermission.canAskAgain) {
        const requestedPermission = await MediaLibrary.requestPermissionsAsync();
        hasPermission = requestedPermission.granted;
      }

      if (!hasPermission) {
        setRecentPhotos([]);
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: 8,
        mediaType: MediaLibrary.MediaType.photo,
      });

      const photos = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
            const renderableUri = isRenderableImageUri(assetInfo.localUri) ? assetInfo.localUri : null;

            if (!renderableUri) {
              return null;
            }

            return {
              id: asset.id,
              uri: renderableUri,
            } satisfies RecentPhoto;
          } catch (error) {
            console.log('Auren media library asset info error:', error);
            return null;
          }
        }),
      );

      setRecentPhotos(photos.filter((photo): photo is RecentPhoto => photo !== null));
    } catch (error) {
      console.log('Auren media library preview error:', error);
      setRecentPhotos([]);
    }
  }

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
          dragTranslateY.setValue(Math.max(0, gesture.dy));
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
          <View style={styles.photosHeader}>
            <Text style={styles.photosTitle}>Photos</Text>

            <Pressable onPress={props.onPhotos} hitSlop={12}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces
            contentContainerStyle={styles.photoStripContent}
          >
            <CameraCard onPress={props.onCamera} />

            {recentPhotos.length > 0 ? (
              recentPhotos.map((photo, index) => (
                <PhotoPreviewCard
                  key={photo.id}
                  uri={photo.uri}
                  selected={index === 1}
                  onPress={props.onPhotos}
                />
              ))
            ) : (
              <>
                <EmptyPhotoPreviewCard onPress={props.onPhotos} />
                <EmptyPhotoPreviewCard onPress={props.onPhotos} />
                <EmptyPhotoPreviewCard onPress={props.onPhotos} />
              </>
            )}
          </ScrollView>

          <View style={styles.sectionDivider} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add files"
            onPress={props.onFiles}
            style={({ pressed }) => [styles.addFilesRow, pressed && styles.pressed]}
          >
            <View style={styles.addFilesIconSlot}>
              <Ionicons name="attach-outline" size={35} color={ICON_COLOR} />
            </View>
            <Text style={styles.addFilesLabel}>Add files</Text>
          </Pressable>

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

function CameraCard({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Camera"
      onPress={onPress}
      style={({ pressed }) => [styles.cameraCard, pressed && styles.pressed]}
    >
      <Ionicons name="camera-outline" size={36} color={ICON_COLOR} />
      <Text style={styles.cameraLabel}>Camera</Text>
    </Pressable>
  );
}

function PhotoPreviewCard({
  uri,
  selected,
  onPress,
}: {
  uri: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Photo"
      onPress={onPress}
      style={({ pressed }) => [styles.photoPreviewCard, pressed && styles.pressed]}
    >
      <Image source={{ uri }} style={styles.photoPreviewImage} />
      <View style={[styles.selectionRing, selected && styles.selectionRingSelected]} />
    </Pressable>
  );
}

function EmptyPhotoPreviewCard({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Photo"
      onPress={onPress}
      style={({ pressed }) => [styles.emptyPhotoPreviewCard, pressed && styles.pressed]}
    >
      <Text style={styles.emptyPreviewTitle}>{'Good evening,\nlet’s study smarter.'}</Text>
      <View style={styles.emptyPreviewPills}>
        <View style={styles.emptyPreviewPill} />
        <View style={styles.emptyPreviewPill} />
        <View style={styles.emptyPreviewPill} />
      </View>
      <View style={styles.selectionRing} />
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
      <View style={styles.connectorIconFrame}>
        <Image source={connector.icon} style={styles.connectorIconImage} />
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
    maxHeight: '76%',
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
    marginTop: 18,
    marginBottom: 23,
    backgroundColor: 'rgba(37,37,38,0.23)',
  },

  scrollContent: {
    paddingBottom: 8,
  },

  photosHeader: {
    paddingHorizontal: 24,
    marginBottom: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  photosTitle: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.65,
  },

  seeAllText: {
    color: '#3d6d94',
    fontSize: 18.8,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  photoStripContent: {
    paddingLeft: 24,
    paddingRight: 24,
    gap: 14,
  },

  cameraCard: {
    width: 122,
    height: 132,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PHOTO_CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.032)',
  },

  cameraLabel: {
    marginTop: 17,
    color: colors.text,
    fontSize: 18.4,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.24,
  },

  photoPreviewCard: {
    width: 122,
    height: 132,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.07)',
  },

  photoPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  emptyPhotoPreviewCard: {
    width: 122,
    height: 132,
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingTop: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.07)',
  },

  emptyPreviewTitle: {
    color: 'rgba(74,73,82,0.72)',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 12.5,
    lineHeight: 15,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  emptyPreviewPills: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },

  emptyPreviewPill: {
    width: 26,
    height: 16,
    borderRadius: 7,
    backgroundColor: 'rgba(17,24,39,0.06)',
  },

  selectionRing: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  selectionRingSelected: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(17,24,39,0.22)',
  },

  sectionDivider: {
    height: 1,
    marginTop: 20,
    marginHorizontal: 24,
    backgroundColor: 'rgba(17,24,39,0.09)',
  },

  addFilesRow: {
    minHeight: 68,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },

  addFilesIconSlot: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  addFilesLabel: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '400',
    letterSpacing: -0.35,
  },

  actionList: {
    paddingHorizontal: 24,
    gap: 0,
  },

  actionRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIconSlot: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  actionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 18.7,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.24,
  },

  pressed: {
    opacity: 0.58,
  },

  divider: {
    height: 1,
    marginTop: 14,
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(17,24,39,0.105)',
  },

  sectionTitle: {
    color: 'rgba(67,68,74,0.82)',
    fontSize: 18.4,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.18,
    marginBottom: 15,
    paddingHorizontal: 24,
  },

  connectorsList: {
    gap: 6,
    paddingHorizontal: 24,
  },

  connectorRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
  },

  connectorIconFrame: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  connectorIconImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },

  connectorLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 18.5,
    lineHeight: 24,
    fontWeight: '400',
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
