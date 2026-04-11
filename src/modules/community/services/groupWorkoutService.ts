import { supabase } from '../../../services/supabase';

export interface GroupWorkout {
  id: string;
  group_id: string;
  created_by: string;
  name: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed_by: string[];
  created_at: string;
}

export const loadGroupWorkouts = async (
  groupId: string
): Promise<GroupWorkout[]> => {
  const { data, error } = await supabase
    .from('group_workouts')
    .select('id, group_id, created_by, name, description, duration, difficulty, completed_by, created_at')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as any[];
};

export const addGroupWorkout = async (
  groupId: string,
  userId: string,
  name: string,
  description: string,
  duration: string,
  difficulty: GroupWorkout['difficulty']
): Promise<GroupWorkout | null> => {
  const { data, error } = await supabase
    .from('group_workouts')
    .insert({
      group_id: groupId,
      created_by: userId,
      name,
      description,
      duration,
      difficulty,
      completed_by: [],
    })
    .select()
    .single();

  if (error) return null;
  return data as any;
};

export const completeGroupWorkout = async (
  workoutId: string,
  userId: string
): Promise<boolean> => {
  const { data: workout } = await supabase
    .from('group_workouts')
    .select('completed_by')
    .eq('id', workoutId)
    .single();

  if (!workout) return false;

  const completedBy: string[] = workout.completed_by ?? [];
  if (completedBy.includes(userId)) return true;

  const { error } = await supabase
    .from('group_workouts')
    .update({ completed_by: [...completedBy, userId] })
    .eq('id', workoutId);

  return !error;
};

export const deleteGroupWorkout = async (
  workoutId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('group_workouts')
    .delete()
    .eq('id', workoutId);
  return !error;
};