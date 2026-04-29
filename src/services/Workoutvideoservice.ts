// src/services/workoutVideoService.ts
// ─────────────────────────────────────────────────────────────
// Workout Video Map — YouTube video IDs for each exercise
//
// WHY YOUTUBE:
//   Free, no API key needed for basic linking, works on all devices.
//   Opens in YouTube app if installed, browser otherwise.
//   Zero hosting cost.
//
// HOW TO USE IN ACTIVITY SCREEN:
//   import { getWorkoutVideoUrl, openWorkoutVideo } from '../../services/workoutVideoService';
//
//   // In exercise card:
//   <TouchableOpacity onPress={() => openWorkoutVideo(exercise.name)}>
//     <Ionicons name="play-circle-outline" size={20} color={theme.accent} />
//   </TouchableOpacity>
// ─────────────────────────────────────────────────────────────

import { Linking, Alert } from 'react-native';

// YouTube video IDs mapped to exercise names (case-insensitive match)
// All videos selected for: clear form demo, no intro waffle, under 3 mins
const EXERCISE_VIDEOS: Record<string, string> = {
  // Chest
  'push up':              'IODxDxX7oi4',
  'push-up':              'IODxDxX7oi4',
  'bench press':          'rT7DgCr-3pg',
  'incline bench press':  'DbFgADa2PL8',
  'chest fly':            'eozdVDA78K0',
  'dumbbell fly':         'eozdVDA78K0',
  'chest dip':            'yN6Q1UI_xjI',

  // Back
  'pull up':              'eGo4IYlbE5g',
  'pull-up':              'eGo4IYlbE5g',
  'chin up':              'eGo4IYlbE5g',
  'lat pulldown':         'CAwf7n6Luuc',
  'bent over row':        'kBWAon7ItDw',
  'seated row':           'GZbfZ033f74',
  'deadlift':             'op9kVnSso6Q',
  'romanian deadlift':    'JCXUYuzwNrM',

  // Shoulders
  'overhead press':       'QAQ64nK-oI',
  'shoulder press':       'qEwKCR5JCog',
  'lateral raise':        'kDqklk2ZLTM',
  'front raise':          'sOAafUXoMoE',
  'face pull':            'rep-qVOkqgk',
  'arnold press':         '6Z15_WdXmVw',

  // Arms
  'bicep curl':           'ykJmrZ5v0Oo',
  'hammer curl':          'zC3nLlEvin4',
  'tricep dip':           '6kALZikXxLc',
  'tricep pushdown':      'vB5OHsJ3EME',
  'skull crusher':        'NIKnImMmPqg',
  'preacher curl':        'fIWP-FRFNU0',

  // Legs
  'squat':                'aclHkVaku9U',
  'barbell squat':        'aclHkVaku9U',
  'goblet squat':         'MxsFDozB-2Y',
  'lunges':               '3XDriUn0udo',
  'lunge':                '3XDriUn0udo',
  'leg press':            'IZxyjW7SKSA',
  'leg curl':             'Orxowest56U',
  'leg extension':        'YyvSfVjQeL0',
  'calf raise':           'gwLzBJYoWlQ',
  'hip thrust':           'SEdqd1n0cvg',
  'glute bridge':         'OUgsJ8-Vi0E',
  'step up':              'dQqApCGd5Ss',

  // Core
  'plank':                'ASdvN_XEl_c',
  'crunch':               'Xyd_fa5zoEU',
  'sit up':               'jDwoBqPH0jk',
  'sit-up':               'jDwoBqPH0jk',
  'russian twist':        '9Y3PBhbMFCo',
  'leg raise':            'JB2oyawG9KI',
  'mountain climber':     'nmwgirgXLYM',
  'bicycle crunch':       '9FGilxCbdz8',
  'ab rollout':           'D6SuKFPFqGQ',
  'hollow body hold':     'LlDNef_Ztsc',

  // Cardio / Functional
  'burpee':               'dZgVxmf6jkA',
  'jumping jack':         'iSSAk4XCsRA',
  'jump rope':            'u3zgHI8QnqE',
  'high knees':           'ZZZoCNMU48U',
  'box jump':             'hxldG9GqBFk',
  'kettlebell swing':     'sSESeQAir2Y',
  'battle ropes':         '8bFubkCPmCw',

  // Stretches / Mobility
  'hip flexor stretch':   'kE4eqaFBSB0',
  'hamstring stretch':    'oyTHJc9cTVs',
  'shoulder stretch':     'wLMSrrZPMgU',
  'child pose':           'eqVMAPM00Nm',
  "child's pose":         'eqVMAPM00Nm',
  'pigeon pose':          '1GOaAlqBrqA',
  'cat cow':              'kqnua4rHVVA',
};

// Fuzzy match — finds the best video for an exercise name
export const getWorkoutVideoId = (exerciseName: string): string | null => {
  const name = exerciseName.toLowerCase().trim();

  // Exact match first
  if (EXERCISE_VIDEOS[name]) return EXERCISE_VIDEOS[name];

  // Partial match — check if exercise name contains any key
  for (const [key, videoId] of Object.entries(EXERCISE_VIDEOS)) {
    if (name.includes(key) || key.includes(name)) return videoId;
  }

  return null;
};

export const getWorkoutVideoUrl = (exerciseName: string): string | null => {
  const videoId = getWorkoutVideoId(exerciseName);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
};

export const openWorkoutVideo = async (exerciseName: string): Promise<void> => {
  const url = getWorkoutVideoUrl(exerciseName);
  if (!url) {
    Alert.alert(
      'No video found',
      `We don't have a demo video for "${exerciseName}" yet. Try searching YouTube for proper form.`,
      [{ text: 'OK' }]
    );
    return;
  }

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // Fallback to YouTube search
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' proper form')}`;
    await Linking.openURL(searchUrl);
  }
};