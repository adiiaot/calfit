import { useState, useEffect } from 'react';
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

  // useEffect instead of useFocusEffect — only loads once on mount
  // useFocusEffect was re-fetching data every time the tab was switched
  // which overwrote the optimistic participant count update
  useEffect(() => {
    if (userId) load();
  }, [userId]);

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
    // Update UI immediately — optimistic update
    // Do this BEFORE the Supabase call so the count stays correct
    // if the user switches tabs before the call completes
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

    // Then persist to Supabase
    const success = isJoined
      ? await leaveChallenge(userId, challengeId)
      : await joinChallenge(userId, challengeId);

    // If Supabase call failed, revert the optimistic update
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