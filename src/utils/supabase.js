// src/utils/supabase.js
// WORKING VERSION - Fixes all auth and RLS issues
import { createClient } from '@supabase/supabase-js';

// Environment variables with your actual fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eukbotdgyqtcwrfwtwso.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2JvdGRneXF0Y3dyZnd0d3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Nzg4NzMsImV4cCI6MjA2NTA1NDg3M30.j30bPCjK0w2vB7anM8jL5-CJ3SFs0MbEieCcRIQZUog';

console.log('🔗 Supabase URL source:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'environment variable' : 'fallback');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth Functions with proper error handling
export const signUp = async (email, password) => {
  try {
    console.log('🔐 Starting signup for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ Signup error:', error);
      throw error;
    }

    console.log('✅ Signup successful, user ID:', data.user?.id);
    
    // Don't create profile here - let the auth state change handle it
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Signup exception:', error.message);
    return { success: false, error: error.message };
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('🔐 Starting signin for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Signin error:', error);
      throw error;
    }

    console.log('✅ Signin successful');
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Signin exception:', error.message);
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    console.log('🚪 Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('✅ Signout successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Signout error:', error.message);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const onAuthChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Exported profile creation function
export const createUserProfile = async (user) => {
  try {
    console.log('👤 Creating profile for user:', user.id);
    
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      console.log('👤 Profile already exists');
      return { success: true, data: existingProfile };
    }

    // Profile doesn't exist, create it
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

    if (error) {
      console.error('❌ Profile creation error:', error);
      throw error;
    }

    console.log('✅ Profile created successfully');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Profile creation exception:', error.message);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    console.log('👤 Updating profile for:', userId);
    
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
    
    console.log('✅ Profile updated successfully');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Profile update error:', error.message);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    console.log('👤 Getting profile for:', userId);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!data) {
      console.log('👤 No profile found');
      return { success: true, data: null };
    }

    console.log('✅ Profile retrieved successfully');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Profile retrieval error:', error.message);
    return { success: false, error: error.message };
  }
};

// Chat Functions
export const saveChatMessage = async (userId, messageType, content, context = {}) => {
  try {
    console.log('💬 Saving chat message for:', userId);
    
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
    
    console.log('✅ Chat message saved');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Chat save error:', error.message);
    return { success: false, error: error.message };
  }
};

export const loadChatHistory = async (userId, limit = 20) => {
  try {
    console.log('💬 Loading chat history for:', userId);
    
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

    console.log(`✅ Loaded ${messages.length} chat messages`);
    return { success: true, messages };
  } catch (error) {
    console.error('❌ Chat load error:', error.message);
    return { success: false, error: error.message, messages: [] };
  }
};

export const getRecentMessages = async (userId) => {
  try {
    console.log('💬 Getting recent messages for:', userId);
    
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

    console.log(`✅ Retrieved ${messages.length} recent messages`);
    return messages;
  } catch (error) {
    console.error('❌ Recent messages error:', error.message);
    return [];
  }
};

// Goals Functions  
export const saveGoal = async (userId, goal) => {
  try {
    console.log('🎯 Saving goal for:', userId);
    
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

    console.log('✅ Goal saved successfully');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Goal save error:', error.message);
    return { success: false, error: error.message };
  }
};

export const loadGoals = async (userId) => {
  try {
    console.log('🎯 Loading goals for:', userId);
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log(`✅ Loaded ${data.length} goals`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Goals load error:', error.message);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateGoalProgress = async (goalId, progress) => {
  try {
    console.log('🎯 Updating goal progress:', goalId);
    
    const { data, error } = await supabase
      .from('goals')
      .update({ 
        progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select();

    if (error) throw error;
    
    console.log('✅ Goal progress updated');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Goal progress error:', error.message);
    return { success: false, error: error.message };
  }
};

// Tasks Functions
export const saveTask = async (userId, task) => {
  try {
    console.log('📋 Saving task for:', userId);
    
    const taskData = {
      user_id: userId,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      estimated_duration: task.estimated_duration || null,
      voice_input: task.voice_input || false,
      completed_at: task.completed_at ? new Date(task.completed_at).toISOString() : null
    };

    let query;
    if (task.id && typeof task.id === 'string' && task.id.includes('-')) {
      query = supabase.from('tasks').update(taskData).eq('id', task.id).select();
    } else {
      query = supabase.from('tasks').insert([taskData]).select();
    }

    const { data, error } = await query;
    if (error) throw error;

    console.log('✅ Task saved successfully');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Task save error:', error.message);
    return { success: false, error: error.message };
  }
};

export const loadTasks = async (userId) => {
  try {
    console.log('📋 Loading tasks for:', userId);
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log(`✅ Loaded ${data.length} tasks`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Tasks load error:', error.message);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateTaskStatus = async (taskId, status, completedAt = null) => {
  try {
    console.log('📋 Updating task status:', taskId);
    
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
    
    console.log('✅ Task status updated');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Task status error:', error.message);
    return { success: false, error: error.message };
  }
};

export const deleteTask = async (taskId) => {
  try {
    console.log('🗑️ Deleting task:', taskId);
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    
    console.log('✅ Task deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Task delete error:', error.message);
    return { success: false, error: error.message };
  }
};

// Bulk save functions
export const saveMultipleGoals = async (userId, goals) => {
  try {
    console.log('🎯 Saving multiple goals for:', userId);
    
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
    
    console.log(`✅ Saved ${data.length} goals`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Multiple goals error:', error.message);
    return { success: false, error: error.message };
  }
};

export const saveMultipleTasks = async (userId, tasks) => {
  try {
    console.log('📋 Saving multiple tasks for:', userId);
    
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
    
    console.log(`✅ Saved ${data.length} tasks`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Multiple tasks error:', error.message);
    return { success: false, error: error.message };
  }
};

export default supabase;
