import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';

interface Props {
  theme: typeof colors.dark;
  visible: boolean;
  selectedImageUri: string | null;
  isUploading: boolean;
  moderationError: string | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onClose: () => void;
}

export function ImageUploadSheet({
  theme,
  visible,
  selectedImageUri,
  isUploading,
  moderationError,
  onPickImage,
  onRemoveImage,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, {
          backgroundColor: theme.card,
          borderColor: theme.border,
        }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Add Photo
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Moderation policy notice */}
          <View style={[styles.notice, {
            backgroundColor: theme.accentDim as string,
            borderColor: theme.accent,
          }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={theme.accent} />
            <Text style={[styles.noticeText, { color: theme.accent }]}>
              Every image is scanned by AI before posting. Inappropriate content will be blocked automatically.
            </Text>
          </View>

          {/* Image preview */}
          {selectedImageUri ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.preview}
                resizeMode="cover"
              />
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.uploadingText}>Scanning image...</Text>
                </View>
              )}
              {!isUploading && (
                <TouchableOpacity
                  onPress={onRemoveImage}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={onPickImage}
              style={[styles.pickBtn, {
                backgroundColor: theme.bg,
                borderColor: theme.border,
              }]}
            >
              <Ionicons name="image-outline" size={32} color={theme.textMuted} />
              <Text style={[styles.pickBtnText, { color: theme.textMuted }]}>
                Tap to select a photo
              </Text>
              <Text style={[styles.pickBtnSub, { color: theme.textMuted }]}>
                Fitness, food, workouts and progress photos only
              </Text>
            </TouchableOpacity>
          )}

          {/* Moderation error */}
          {moderationError && (
            <View style={[styles.errorBox, {
              backgroundColor: theme.red + '18',
              borderColor: theme.red,
            }]}>
              <Ionicons name="warning-outline" size={16} color={theme.red} />
              <Text style={[styles.errorText, { color: theme.red }]}>
                {moderationError}
              </Text>
            </View>
          )}

          {/* Pick button if image already selected */}
          {selectedImageUri && !isUploading && (
            <TouchableOpacity
              onPress={onPickImage}
              style={[styles.changeBtn, {
                backgroundColor: theme.bg,
                borderColor: theme.border,
              }]}
            >
              <Text style={[styles.changeBtnText, { color: theme.textSecondary }]}>
                Choose different photo
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  dismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  noticeText: { fontSize: fontSize.xs, flex: 1, lineHeight: 16, fontWeight: '600' },
  previewWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
  },
  preview: { width: '100%', height: '100%' },
  uploadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  uploadingText: { color: '#fff', fontWeight: '700', fontSize: fontSize.base },
  removeBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  pickBtn: {
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pickBtnText: { fontSize: fontSize.base, fontWeight: '600' },
  pickBtnSub: { fontSize: fontSize.xs, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  errorText: { fontSize: fontSize.sm, flex: 1, lineHeight: 18 },
  changeBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  changeBtnText: { fontSize: fontSize.sm, fontWeight: '600' },
});