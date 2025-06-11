// src/utils/supabase.js
// QUICK FIX - No validation, just create the client
import { createClient } from '@supabase/supabase-js';

// Get environment variables (no validation)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client (will handle empty values gracefully)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth Functions
export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile automatically
    if (data.user) {
      await createUserProfile(data.user);
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const onAuthChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// User Profile Functions
const createUserProfile = async (user) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([{
        id: user.id,
        email: user.email,
        full_name: user.email.split('@')[0],
        onboarding_completed: false,
        onboarding_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error };
  }
};

// Chat Functions
export const saveChatMessage = async (userId, messageType, content, context = {}) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert([{
        user_id: userId,
        conversation_id: `conv_${userId}_${new Date().toISOString().split('T')[0]}`,
        message_type: messageType,
        content: content,
        context: context,
        voice_input: false
      }])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving message:', error);
    return { success: false, error };
  }
};

export const loadChatHistory = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const messages = data.map(row => ({
      role: row.message_type,
      content: row.content,
      timestamp: new Date(row.created_at),
      context: row.context
    }));

    return { success: true, messages };
  } catch (error) {
    console.error('Error loading chat history:', error);
    return { success: false, error };
  }
};

export const getRecentMessages = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('message_type, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const messages = data.reverse().map(row => ({
      role: row.message_type,
      content: row.content
    }));

    return messages;
  } catch (error) {
    console.error('Error loading recent messages:', error);
    return [];
  }
};

// Goals Functions
export const saveGoal = async (userId, goal) => {
  try {
    const goalData = {
      user_id: userId,
      title: goal.title,
      description: goal.description,
      priority: goal.priority || 'medium',
      status: goal.status || 'active',
      progress: goal.progress || 0,
      target_date: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null
    };

    // If goal has an ID, update it; otherwise, insert new
    let query;
    if (goal.id && typeof goal.id === 'string' && goal.id.includes('-')) {
      // Real UUID from database
      query = supabase.from('goals').update(goalData).eq('id', goal.id).select();
    } else {
      // New goal or local ID
      query = supabase.from('goals').insert([goalData]).select();
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error saving goal:', error);
    return { success: false, error };
  }
};

export const loadGoals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error loading goals:', error);
    return { success: false, error };
  }
};

export const updateGoalProgress = async (goalId, progress) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update({ 
        progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return { success: false, error };
  }
};

// Tasks Functions
export const saveTask = async (userId, task) => {
  try {
    const taskData = {
      user_id: userId,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      estimated_duration: task.estimated_duration || null,
      voice_input: task.voice_input || false,
      completed_at: task.completed_at ? task.completed_at.toISOString() : null
    };

    // If task has a real UUID, update it; otherwise, insert new
    let query;
    if (task.id && typeof task.id === 'string' && task.id.includes('-')) {
      // Real UUID from database
      query = supabase.from('tasks').update(taskData).eq('id', task.id).select();
    } else {
      // New task or local ID
      query = supabase.from('tasks').insert([taskData]).select();
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error saving task:', error);
    return { success: false, error };
  }
};

export const loadTasks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error loading tasks:', error);
    return { success: false, error };
  }
};

export const updateTaskStatus = async (taskId, status, completedAt = null) => {
  try {
    const updateData = { 
      status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed' && !completedAt) {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'pending') {
      updateData.completed_at = null;
    } else if (completedAt) {
      updateData.completed_at = completedAt.toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error updating task status:', error);
    return { success: false, error };
  }
};

export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error };
  }
};

// Bulk save functions for initial onboarding
export const saveMultipleGoals = async (userId, goals) => {
  try {
    const goalsToInsert = goals.map(goal => ({
      user_id: userId,
      title: goal.title,
      description: goal.description,
      priority: goal.priority || 'medium',
      status: goal.status || 'active',
      progress: goal.progress || 0,
      target_date: goal.deadline ? goal.deadline.toISOString().split('T')[0] : null
    }));

    const { data, error } = await supabase
      .from('goals')
      .insert(goalsToInsert)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving multiple goals:', error);
    return { success: false, error };
  }
};

export const saveMultipleTasks = async (userId, tasks) => {
  try {
    const tasksToInsert = tasks.map(task => ({
      user_id: userId,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      estimated_duration: task.estimated_duration || null,
      voice_input: task.voice_input || false
    }));

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving multiple tasks:', error);
    return { success: false, error };
  }
};

export default supabase;
