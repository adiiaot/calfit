import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  AUTO_CHALLENGES,
  ChallengeEntry,
  loadJoinedChallengeIds,
  joinChallenge,
  leaveChallenge,
} from '../services/challengeService';

export function useChallenge(userId: string) {
  const [challenges, setChallenges] = useState<ChallengeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (userId) load();
    }, [userId])
  );

  const load = async () => {
    setIsLoading(true);
    const joinedIds = await loadJoinedChallengeIds(userId);
    const joinedSet = new Set(joinedIds);
    setChallenges(
      AUTO_CHALLENGES.map((c) => ({ ...c, joined: joinedSet.has(c.id) }))
    );
    setIsLoading(false);
  };

  const toggle = async (challengeId: string, currentlyJoined: boolean) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              joined: !currentlyJoined,
              participants: currentlyJoined
                ? c.participants - 1
                : c.participants + 1,
            }
          : c
      )
    );
    if (currentlyJoined) {
      await leaveChallenge(userId, challengeId);
    } else {
      await joinChallenge(userId, challengeId);
    }
  };

  return { challenges, isLoading, toggle };
}