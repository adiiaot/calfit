export type AnimationType =
  | 'squat'
  | 'pushup'
  | 'pullup'
  | 'crunch'
  | 'plank'
  | 'run'
  | 'jumpingjack'
  | 'curl'
  | 'dips'
  | 'glutebridge'
  | 'lunge'
  | 'legraise'
  | 'superman'
  | 'calfraise'
  | 'stretch';

const EXERCISE_ANIMATION_MAP: Record<string, AnimationType> = {
  // ── ARMS ──────────────────────────────────────────────────
  'Bicep Curls':       'curl',
  'Tricep Dips':       'dips',
  'Tricep Push Ups':   'pushup',

  // ── BACK ──────────────────────────────────────────────────
  'Chin Ups':          'pullup',
  'Inverted Rows':     'pullup',
  'Pull Ups':          'pullup',
  'Superman Hold':     'superman',

  // ── CARDIO ────────────────────────────────────────────────
  'Box Jumps':         'jumpingjack',
  'Burpees':           'run',
  'High Knees':        'run',
  'Jump Rope':         'jumpingjack',
  'Jumping Jacks':     'jumpingjack',
  'Mountain Climbers': 'plank',
  'Running in Place':  'run',
  'Star Jumps':        'jumpingjack',

  // ── CHEST ─────────────────────────────────────────────────
  'Chest Dips':        'dips',
  'Decline Push Ups':  'pushup',
  'Diamond Push Ups':  'pushup',
  'Push Ups':          'pushup',
  'Wide Push Ups':     'pushup',

  // ── CORE ──────────────────────────────────────────────────
  'Bicycle Crunches':  'crunch',
  'Crunches':          'crunch',
  'Dead Bug':          'crunch',
  'Leg Raises':        'legraise',
  'Plank':             'plank',
  'Russian Twists':    'legraise',
  'V-Ups':             'crunch',

  // ── FLEXIBILITY ───────────────────────────────────────────
  "Cat Cow Stretch":   'stretch',
  "Child's Pose":      'stretch',
  'Hamstring Stretch': 'stretch',
  'Hip Flexor Stretch':'stretch',

  // ── LEGS ──────────────────────────────────────────────────
  'Calf Raises':       'calfraise',
  'Donkey Kicks':      'glutebridge',
  'Glute Bridges':     'glutebridge',
  'Jump Squats':       'squat',
  'Lunges':            'lunge',
  'Squats':            'squat',
  'Step Ups':          'lunge',
  'Wall Sit':          'calfraise',

  // ── SHOULDERS ─────────────────────────────────────────────
  'Lateral Raises':    'curl',
  'Pike Push Ups':     'pushup',
};

export function getExerciseAnimation(exerciseName: string): AnimationType {
  return EXERCISE_ANIMATION_MAP[exerciseName] ?? 'squat';
}