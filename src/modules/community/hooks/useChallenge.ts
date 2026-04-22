import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  AUTO_CHALLENGES,
  ChallengeEntry,
  loadJoinedChallengeIds,
  loadParticipantCounts,
  joinChallenge,
  leaveChallenge,
} from '../services/challengeService';

export function useChallenge(userId: string) {
  const [challenges, setChallenges] = useState<ChallengeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // useFocusEffect instead of useEffect so counts refresh every time
  // the Community screen comes into focus — fixes stale participant counts
  // when a second device joins and the first device returns to the screen.
  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId])
  );

  const load = async () => {
    setIsLoading(true);

    const [joinedIds, participantCounts] = await Promise.all([
      loadJoinedChallengeIds(userId),
      loadParticipantCounts(),
    ]);

    const joinedSet = new Set(joinedIds);

    const merged: ChallengeEntry[] = AUTO_CHALLENGES.map((c) => ({
      ...c,
      participants: participantCounts[c.id] ?? 0,
      joined: joinedSet.has(c.id),
    }));

    setChallenges(merged);
    setIsLoading(false);
  };

  const toggle = async (challengeId: string, isJoined: boolean) => {
    // Optimistic update
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              joined: !isJoined,
              participants: isJoined
                ? Math.max(c.participants - 1, 0)
                : c.participants + 1,
            }
          : c
      )
    );

    const success = isJoined
      ? await leaveChallenge(userId, challengeId)
      : await joinChallenge(userId, challengeId);

    // Revert if failed
    if (!success) {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? {
                ...c,
                joined: isJoined,
                participants: isJoined
                  ? c.participants + 1
                  : Math.max(c.participants - 1, 0),
              }
            : c
        )
      );
    }
  };

  return { challenges, isLoading, toggle, reload: load };
}