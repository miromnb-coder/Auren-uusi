import { Globe2, GraduationCap, HeartPulse, Leaf, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const CATEGORY_ICON_COLOR = 'rgba(15,17,21,0.9)';
const KEYBOARD_FALLBACK_HEIGHT = 336;

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

function CategoryIcon({ icon, active }: { icon: 'homework' | 'writing' | 'health' | 'language'; active: boolean }) {
  const color = active ? '#ffffff' : CATEGORY_ICON_COLOR;
  const strokeWidth = active ? 2.05 : 1.72;

  if (icon === 'homework') return <GraduationCap size={21} color={color} strokeWidth={strokeWidth} />;
  if (icon === 'writing') return <Leaf size={21} color={color} strokeWidth={strokeWidth} />;
  if (icon === 'health') return <HeartPulse size={21} color={color} strokeWidth={strokeWidth} />;
  return <Globe2 size={21} color={color} strokeWidth={strokeWidth} />;
}

export function AurenCreateProjectSheet({ visible, submitting = false, error = null, onClose, onSubmit }: AurenCreateProjectSheetProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const keyboardHeight = useRef(new Animated.Value(visible ? KEYBOARD_FALLBACK_HEIGHT : 0)).current;
  const [mounted, setMounted] = useState(visible);
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('Homework');
  const canSubmit = projectName.trim().length > 0 && !submitting;

  const keyboardTarget = useMemo(() => Math.max(KEYBOARD_FALLBACK_HEIGHT - insets.bottom, 292), [insets.bottom]);

  useEffect(() => {
    if (visible) {
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
      }
    });
  }, [keyboardHeight, progress, visible]);

  useEffect(() => {
    if (!mounted) return undefined;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = Math.max(0, event.endCoordinates.height - insets.bottom);
      Animated.timing(keyboardHeight, {
        toValue: nextHeight,
        duration: event.duration ?? 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (!visible) {
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

  const overlayOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] });
  const sheetTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [460, 0] });

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit) return;
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

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
        <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: overlayOpacity }]} />
        <View pointerEvents="box-none" style={styles.sheetHost}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}> 
            <View style={styles.handle} />
            <Pressable accessibilityRole="button" accessibilityLabel="Close new project" disabled={submitting} onPress={handleClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed, submitting && styles.disabled]}>
              <X size={24} color={colors.text} strokeWidth={1.85} />
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
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              style={styles.input}
            />

            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => {
                const active = category.label === selectedCategory;
                return (
                  <Pressable
                    key={category.label}
                    accessibilityRole="button"
                    accessibilityLabel={category.label}
                    onPress={() => handleSelectCategory(category.label)}
                    style={({ pressed }) => [styles.categoryPill, active && styles.categoryPillActive, pressed && styles.pressed]}
                  >
                    <CategoryIcon icon={category.icon} active={active} />
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{category.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable accessibilityRole="button" accessibilityLabel="Create project" disabled={!canSubmit} onPress={handleSubmit} style={({ pressed }) => [styles.createButton, !canSubmit && styles.createButtonDisabled, pressed && canSubmit && styles.createButtonPressed]}>
              <Text style={[styles.createButtonText, !canSubmit && styles.createButtonTextDisabled]}>Create project</Text>
            </Pressable>
          </Animated.View>

          <Animated.View pointerEvents="none" style={{ height: keyboardHeight }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111111' },
  sheetHost: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 28,
    paddingHorizontal: 32,
    paddingBottom: 24,
    backgroundColor: '#fffefb',
    shadowColor: '#111827',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -12 },
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    marginBottom: 26,
    backgroundColor: 'rgba(104,103,117,0.23)',
  },
  closeButton: {
    position: 'absolute',
    top: 46,
    right: 32,
    width: 49,
    height: 49,
    borderRadius: 24.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,241,237,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.035)',
  },
  title: { color: colors.text, fontFamily: serifFont, fontSize: 27, lineHeight: 33, letterSpacing: -0.68 },
  subtitle: {
    marginTop: 13,
    maxWidth: 330,
    color: colors.muted,
    fontSize: 15.8,
    lineHeight: 22.2,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  input: {
    height: 68,
    marginTop: 28,
    borderRadius: 18,
    paddingHorizontal: 21,
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.2,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.2)',
  },
  categoryGrid: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryPill: {
    width: '48.5%',
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(104,103,117,0.17)',
  },
  categoryPillActive: { backgroundColor: '#1d1a18', borderColor: '#1d1a18' },
  categoryLabel: { color: colors.text, fontSize: 15.8, lineHeight: 20, fontWeight: '500', letterSpacing: -0.15 },
  categoryLabelActive: { color: '#ffffff' },
  createButton: {
    height: 62,
    marginTop: 22,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d1a18',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  createButtonDisabled: { backgroundColor: 'rgba(29,26,24,0.5)', shadowOpacity: 0, elevation: 0 },
  createButtonText: { color: '#ffffff', fontSize: 17.4, lineHeight: 22, fontWeight: '600', letterSpacing: -0.18 },
  createButtonTextDisabled: { color: 'rgba(255,255,255,0.86)' },
  errorText: { marginTop: 13, color: '#9f2f2f', fontSize: 13.8, lineHeight: 19, fontWeight: '500', letterSpacing: -0.08 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
  createButtonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.48 },
});
