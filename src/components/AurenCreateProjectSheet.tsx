import { Globe2, GraduationCap, HeartPulse, Leaf, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const CATEGORY_ICON_COLOR = 'rgba(15,17,21,0.9)';
const SHEET_BACKGROUND = '#f7f7f5';
const KEYBOARD_FALLBACK_HEIGHT = 336;
const KEYBOARD_SHEET_GAP = 18;

type ProjectCategory = 'Homework' | 'Writing' | 'Health' | 'Language';

type CreateProjectPayload = {
  title: string;
  description: string | null;
  category?: ProjectCategory;
};

type AurenCreateProjectSheetProps = {
  visible: boolean;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => void;
};

const CATEGORIES: Array<{ label: ProjectCategory; icon: 'homework' | 'writing' | 'health' | 'language' }> = [
  { label: 'Homework', icon: 'homework' },
  { label: 'Writing', icon: 'writing' },
  { label: 'Health', icon: 'health' },
  { label: 'Language', icon: 'language' },
];

function CategoryIcon({ icon }: { icon: 'homework' | 'writing' | 'health' | 'language' }) {
  if (icon === 'homework') return <GraduationCap size={16} color={CATEGORY_ICON_COLOR} strokeWidth={1.74} />;
  if (icon === 'writing') return <Leaf size={16} color={CATEGORY_ICON_COLOR} strokeWidth={1.74} />;
  if (icon === 'health') return <HeartPulse size={16} color={CATEGORY_ICON_COLOR} strokeWidth={1.74} />;
  return <Globe2 size={16} color={CATEGORY_ICON_COLOR} strokeWidth={1.74} />;
}

export function AurenCreateProjectSheet({ visible, submitting = false, error = null, onClose, onSubmit }: AurenCreateProjectSheetProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const closeRequestedRef = useRef(false);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const keyboardHeight = useRef(new Animated.Value(visible ? KEYBOARD_FALLBACK_HEIGHT + KEYBOARD_SHEET_GAP : 0)).current;
  const [mounted, setMounted] = useState(visible);
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('Homework');
  const canSubmit = projectName.trim().length > 0 && !submitting;

  const keyboardTarget = useMemo(
    () => Math.max(KEYBOARD_FALLBACK_HEIGHT - insets.bottom + KEYBOARD_SHEET_GAP, 292 + KEYBOARD_SHEET_GAP),
    [insets.bottom],
  );

  useEffect(() => {
    if (visible) {
      closeRequestedRef.current = false;
      setMounted(true);
      setProjectName('');
      setSelectedCategory('Homework');
      keyboardHeight.setValue(keyboardTarget);
      const focusTimer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(focusTimer);
    }

    return undefined;
  }, [keyboardHeight, keyboardTarget, visible]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 245 : 185,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        keyboardHeight.setValue(0);
        closeRequestedRef.current = false;
      }
    });
  }, [keyboardHeight, progress, visible]);

  useEffect(() => {
    if (!mounted) return undefined;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = Math.max(0, event.endCoordinates.height - insets.bottom + KEYBOARD_SHEET_GAP);
      Animated.timing(keyboardHeight, {
        toValue: nextHeight,
        duration: event.duration ?? 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (!visible || closeRequestedRef.current) {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
        return;
      }

      inputRef.current?.focus();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, keyboardHeight, mounted, visible]);

  if (!mounted) return null;

  const overlayOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.03] });
  const sheetTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [360, 0] });

  function handleClose() {
    if (submitting) return;
    closeRequestedRef.current = true;
    Keyboard.dismiss();
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit) return;
    closeRequestedRef.current = true;
    onSubmit({
      title: projectName.trim(),
      description: selectedCategory ? `Category: ${selectedCategory}` : null,
      category: selectedCategory,
    });
  }

  function handleSelectCategory(category: ProjectCategory) {
    setSelectedCategory(category);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function renderCategory(category: { label: ProjectCategory; icon: 'homework' | 'writing' | 'health' | 'language' }) {
    const active = category.label === selectedCategory;

    return (
      <Pressable
        key={category.label}
        accessibilityRole="button"
        accessibilityLabel={category.label}
        onPress={() => handleSelectCategory(category.label)}
        style={({ pressed }) => [styles.categoryPill, active && styles.categoryPillActive, pressed && styles.pressed]}
      >
        <CategoryIcon icon={category.icon} />
        <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{category.label}</Text>
      </Pressable>
    );
  }

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close new project" onPress={handleClose} style={StyleSheet.absoluteFill}>
          <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: overlayOpacity }]} />
        </Pressable>

        <View pointerEvents="box-none" style={styles.sheetHost}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}> 
            <View style={styles.handle} />
            <Pressable accessibilityRole="button" accessibilityLabel="Close new project" disabled={submitting} onPress={handleClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed, submitting && styles.disabled]}>
              <X size={19} color={colors.text} strokeWidth={1.8} />
            </Pressable>

            <Text style={styles.title}>New project</Text>
            <Text style={styles.subtitle}>{'Create a focused space for one subject,\ngoal, or study area.'}</Text>

            <TextInput
              ref={inputRef}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Project name"
              placeholderTextColor="rgba(104,103,117,0.55)"
              autoFocus
              autoCapitalize="sentences"
              autoCorrect
              blurOnSubmit={false}
              returnKeyType="default"
              onSubmitEditing={handleSubmit}
              style={styles.input}
            />

            <View style={styles.categoryGrid}>
              <View style={styles.categoryRow}>{CATEGORIES.slice(0, 2).map(renderCategory)}</View>
              <View style={[styles.categoryRow, styles.categoryRowSecond]}>{CATEGORIES.slice(2, 4).map(renderCategory)}</View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable accessibilityRole="button" accessibilityLabel="Create project" disabled={!canSubmit} onPress={handleSubmit} style={({ pressed }) => [styles.createButton, !canSubmit && styles.createButtonDisabled, pressed && canSubmit && styles.createButtonPressed]}>
              <Text style={[styles.createButtonText, !canSubmit && styles.createButtonTextDisabled]}>Create project</Text>
            </Pressable>
          </Animated.View>

          <Animated.View pointerEvents="none" style={[styles.keyboardSpacer, { height: keyboardHeight }]} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: SHEET_BACKGROUND },
  sheetHost: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
    paddingHorizontal: 34,
    paddingBottom: 14,
    backgroundColor: SHEET_BACKGROUND,
    shadowColor: '#111827',
    shadowOpacity: 0.055,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -10 },
    elevation: 12,
  },
  keyboardSpacer: {
    width: '100%',
    backgroundColor: SHEET_BACKGROUND,
  },
  handle: {
    alignSelf: 'center',
    width: 43,
    height: 4,
    borderRadius: 999,
    marginBottom: 20,
    backgroundColor: 'rgba(104,103,117,0.24)',
  },
  closeButton: {
    position: 'absolute',
    top: 28,
    right: 32,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,241,237,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.035)',
  },
  title: { color: colors.text, fontFamily: serifFont, fontSize: 21.5, lineHeight: 27, letterSpacing: -0.52 },
  subtitle: {
    marginTop: 7,
    maxWidth: 285,
    color: colors.muted,
    fontSize: 12.8,
    lineHeight: 17.2,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  input: {
    height: 43,
    marginTop: 22,
    borderRadius: 17,
    paddingHorizontal: 17,
    color: colors.text,
    fontSize: 14.7,
    lineHeight: 19,
    fontWeight: '400',
    letterSpacing: -0.14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.18)',
  },
  categoryGrid: { marginTop: 16 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryRowSecond: { marginTop: 8 },
  categoryPill: {
    width: '48.5%',
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.15)',
  },
  categoryPillActive: { backgroundColor: 'rgba(255,255,255,0.62)', borderColor: 'rgba(104,103,117,0.24)' },
  categoryLabel: { color: colors.text, fontSize: 12.8, lineHeight: 16, fontWeight: '500', letterSpacing: -0.11 },
  categoryLabelActive: { color: colors.text },
  createButton: {
    height: 42,
    marginTop: 16,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1a18',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  createButtonDisabled: { backgroundColor: 'rgba(29,26,24,0.48)', shadowOpacity: 0, elevation: 0 },
  createButtonText: { color: '#ffffff', fontSize: 14.3, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  createButtonTextDisabled: { color: 'rgba(255,255,255,0.9)' },
  errorText: { marginTop: 9, color: '#9f2f2f', fontSize: 11.8, lineHeight: 16, fontWeight: '500', letterSpacing: -0.05 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
  createButtonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.48 },
});
