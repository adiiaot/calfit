import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize } from '../../../theme';
import { UserAvatar } from '../../shared/UserAvatar';

export interface LiveStreamData {
  id: string;
  hostName: string;
  hostAvatar?: string | null;
  hostCalfitId: string;
  title: string;
  topic: string;
  viewerCount: number;
  isLive: boolean;
  scheduledFor?: string;
}

interface Props {
  stream: LiveStreamData;
  theme: typeof colors.dark;
  onPress: () => void;
}

export function LiveStreamCard({ stream, theme, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, {
        backgroundColor: theme.card,
        borderColor: stream.isLive ? theme.red : theme.border,
        borderWidth: stream.isLive ? 2 : 1,
      }]}
    >
      {/* Live badge */}
      {stream.isLive && (
        <View style={[styles.liveBadge, { backgroundColor: theme.red }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Host */}
      <View style={styles.hostRow}>
        <UserAvatar
          uri={stream.hostAvatar}
          name={stream.hostName}
          size={40}
          theme={theme}
        />
        <View style={styles.hostInfo}>
          <Text style={[styles.hostName, { color: theme.textPrimary }]}>
            {stream.hostName}
          </Text>
          <Text style={[styles.hostHandle, { color: theme.textMuted }]}>
            @{stream.hostCalfitId}
          </Text>
        </View>
        {stream.isLive && (
          <View style={styles.viewersWrap}>
            <Ionicons name="eye-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.viewers, { color: theme.textMuted }]}>
              {stream.viewerCount}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {stream.title}
      </Text>
      <Text style={[styles.topic, { color: theme.textMuted }]}>
        {stream.topic}
      </Text>

      {/* Watch button */}
      <TouchableOpacity
        onPress={onPress}
        style={[styles.watchBtn, {
          backgroundColor: stream.isLive ? theme.red : theme.accent,
        }]}
      >
        <Ionicons
          name={stream.isLive ? 'play-circle' : 'notifications-outline'}
          size={16}
          color="#fff"
        />
        <Text style={styles.watchBtnText}>
          {stream.isLive ? 'Watch Now' : 'Set Reminder'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  liveDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hostInfo: { flex: 1 },
  hostName: { fontSize: fontSize.base, fontWeight: '700' },
  hostHandle: { fontSize: fontSize.xs },
  viewersWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewers: { fontSize: fontSize.sm, fontWeight: '600' },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  topic: { fontSize: fontSize.sm },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '700',
  },
});