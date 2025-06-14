// src/utils/supabase.js
// PRODUCTION VERSION - Clean and optimized
import { createClient } from '@supabase/supabase-js';

// Environment variables - keeping your existing setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eukbotdgyqtcwrfwtwso.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2JvdGRneXF0Y3dyZnd0d3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Nzg4NzMsImV4cCI6MjA2NTA1NDg3M30.j30bPCjK0w2vB7anM8jL5-CJ3SFs0MbEieCcRIQZUog';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth Functions
export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
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
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const onAuthChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Profile Functions
export const createUserProfile = async (user) => {
  try {
    // Check if profile exists first
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return { success: true, data: existingProfile };
    }

    // Create new profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: user.id,
        email: user.email,
        full_name: user.email.split('@')[0],
        onboarding_completed: false,
        onboarding_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data: data || null };
  } catch (error) {
    return { success: false, error: error.message };
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
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
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
      context: row.context || {}
    }));

    return { success: true, messages };
  } catch (error) {
    return { success: false, error: error.message, messages: [] };
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
      target_date: goal.target_date ? new Date(goal.target_date).toISOString() :
                   goal.deadline ? new Date(goal.deadline).toISOString() : null
    };

    let query;
    if (goal.id && typeof goal.id === 'string' && goal.id.includes('-')) {
      query = supabase.from('goals').update(goalData).eq('id', goal.id).select();
    } else {
      query = supabase.from('goals').insert([goalData]).select();
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};

// Tasks Functions - FIXED: Now properly saves Simpleology fields
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
      completed_at: task.completed_at ? new Date(task.completed_at).toISOString() : null,
      // 🔥 FIX: Include Simpleology fields in database save
      simpleology_id: task.simpleology_id || null,
      imported_from_simpleology: task.imported_from_simpleology || false
    };

    let query;
    if (task.id && typeof task.id === 'string' && task.id.includes('-')) {
      query = supabase.from('tasks').update(taskData).eq('id', task.id).select();
    } else {
      query = supabase.from('tasks').insert([taskData]).select();
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
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
      updateData.completed_at = new Date(completedAt).toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
  }
};

// Bulk Operations - FIXED: Include Simpleology fields in bulk saves
export const saveMultipleGoals = async (userId, goals) => {
  try {
    const goalsToInsert = goals.map(goal => ({
      user_id: userId,
      title: goal.title,
      description: goal.description,
      priority: goal.priority || 'medium',
      status: goal.status || 'active',
      progress: goal.progress || 0,
      target_date: goal.target_date ? new Date(goal.target_date).toISOString() :
                   goal.deadline ? new Date(goal.deadline).toISOString() : null
    }));

    const { data, error } = await supabase
      .from('goals')
      .insert(goalsToInsert)
      .select();

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
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
      voice_input: task.voice_input || false,
      // 🔥 FIX: Include Simpleology fields in bulk operations too
      simpleology_id: task.simpleology_id || null,
      imported_from_simpleology: task.imported_from_simpleology || false
    }));

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// TIMER FUNCTIONS - NEW FOR PHASE 1
export const startTaskTimer = async (taskId, userId) => {
  try {
    const now = new Date().toISOString();
    
    // Update task with timer start info
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .update({
        timer_start_time: now,
        timer_is_running: true,
        updated_at: now
      })
      .eq('id', taskId)
      .select()
      .single();

    if (taskError) throw taskError;

    // Create new timer session
    const { data: sessionData, error: sessionError } = await supabase
      .from('timer_sessions')
      .insert([{
        task_id: taskId,
        user_id: userId,
        start_time: now,
        pause_count: 0
      }])
      .select()
      .single();

    if (sessionError) throw sessionError;

    return { 
      success: true, 
      task: taskData, 
      session: sessionData 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const pauseTaskTimer = async (taskId, userId) => {
  try {
    const now = new Date().toISOString();
    
    // Get current task timer data
    const { data: taskData, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError) throw fetchError;

    // Calculate elapsed time since last start
    const startTime = new Date(taskData.timer_start_time);
    const elapsedSeconds = Math.floor((new Date(now) - startTime) / 1000);
    const newTotalTime = (taskData.timer_total_time || 0) + elapsedSeconds;

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        timer_total_time: newTotalTime,
        timer_pause_count: (taskData.timer_pause_count || 0) + 1,
        timer_is_running: false,
        timer_last_paused: now,
        updated_at: now
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Get current session to update pause count
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from('timer_sessions')
      .select('pause_count')
      .eq('task_id', taskId)
      .is('end_time', null)
      .single();

    if (!sessionFetchError && sessionData) {
      // Update current session pause count
      const { error: sessionError } = await supabase
        .from('timer_sessions')
        .update({
          pause_count: (sessionData.pause_count || 0) + 1
        })
        .eq('task_id', taskId)
        .is('end_time', null);

      if (sessionError) throw sessionError;
    }

    return { success: true, task: updatedTask };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resumeTaskTimer = async (taskId, userId) => {
  try {
    const now = new Date().toISOString();
    
    // Resume timer by setting new start time
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .update({
        timer_start_time: now,
        timer_is_running: true,
        updated_at: now
      })
      .eq('id', taskId)
      .select()
      .single();

    if (taskError) throw taskError;

    return { success: true, task: taskData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const stopTaskTimer = async (taskId, userId) => {
  try {
    const now = new Date().toISOString();
    
    // Get current task timer data
    const { data: taskData, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError) throw fetchError;

    // Calculate final time if timer was running
    let finalTotalTime = taskData.timer_total_time || 0;
    if (taskData.timer_is_running && taskData.timer_start_time) {
      const startTime = new Date(taskData.timer_start_time);
      const elapsedSeconds = Math.floor((new Date(now) - startTime) / 1000);
      finalTotalTime += elapsedSeconds;
    }

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        timer_total_time: finalTotalTime,
        timer_is_running: false,
        timer_start_time: null,
        updated_at: now
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    // End current timer session
    const { error: sessionError } = await supabase
      .from('timer_sessions')
      .update({
        end_time: now,
        total_duration: finalTotalTime
      })
      .eq('task_id', taskId)
      .is('end_time', null);

    if (sessionError) throw sessionError;

    return { success: true, task: updatedTask };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTaskTimerData = async (taskId) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        timer_sessions (
          id,
          start_time,
          end_time,
          total_duration,
          pause_count
        )
      `)
      .eq('id', taskId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default supabase;
