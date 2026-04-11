import {
  View, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  theme: typeof colors.dark;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  theme,
  placeholder = 'Message about workouts and goals...',
}: Props) {
  return (
    <View style={[styles.container, {
      backgroundColor: theme.card,
      borderTopColor: theme.border,
    }]}>
      <View style={[styles.inputWrap, {
        backgroundColor: theme.bg,
        borderColor: theme.border,
      }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }]}
          multiline
          maxLength={500}
        />
      </View>
      <TouchableOpacity
        onPress={onSend}
        disabled={!value.trim()}
        style={[styles.sendBtn, {
          backgroundColor: value.trim() ? theme.accent : theme.border,
        }]}
      >
        <Ionicons name="send" size={18} color={theme.bg} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.md,
    borderTopWidth: 1,
  },
  inputWrap: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  input: { fontSize: fontSize.base, lineHeight: 22 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});