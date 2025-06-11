// src/utils/supabase.js
// MINIMAL FIX - Just adding environment variable validation to your existing code
import { createClient } from '@supabase/supabase-js';

// Environment variables with validation (THIS IS THE MAIN FIX)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file.');
}

if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
console.log('🔗 Supabase client initialized successfully');

// Auth Functions
export const signUp = async (email, password) => {
  try {
    console.log('🔐 Attempting to sign up user:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile automatically
    if (data.user) {
      console.log('👤 Creating user profile for:', data.user.id);
      await createUserProfile(data.user);
    }

    console.log('✅ User signed up successfully');
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Sign up error:', error.message);
    return { success: false, error: error.message };
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('🔐 Attempting to sign in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    console.log('✅ User signed in successfully');
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Sign in error:', error.message);
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    console.log('🚪 Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('✅ User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out error:', error.message);
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
    console.log('👤 Creating user profile in database for:', user.id);
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([{
        id: user.id, // Correct: matches your schema
        email: user.email,
        full_name: user.email.split('@')[0],
        onboarding_completed: false,
        onboarding_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    console.log('✅ User profile created successfully');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error creating user profile:', error.message);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    console.log('👤 Updating user profile for:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId) // Correct: matches your schema
      .select();

    if (error) throw error;
    console.log('✅ User profile updated in database');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error updating user profile:', error.message);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    console.log('👤 Getting user profile for:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId) // Correct: matches your schema
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!data) {
      console.log('👤 No user profile found, user needs onboarding');
      return { success: true, data: null };
    }

    console.log('✅ User profile loaded from database');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error getting user profile:', error.message);
    return { success: false, error: error.message };
  }
};

// Chat Functions (Using your existing ai_conversations table)
export const saveChatMessage = async (userId, messageType, content, context = {}) => {
  try {
    console.log('💬 Saving chat message for user:', userId);
    const { data, error } = await supabase
      .from('ai_conversations') // Correct: matches your schema
      .insert([{
        user_id: userId,
        conversation_id: `conv_${userId}_${new Date().toISOString().split('T')[0]}`,
        message_type: messageType, // Correct: matches your schema
        content: content,
        context: context, // Correct: matches your schema
        voice_input: false
      }])
      .select();

    if (error) throw error;
    console.log('✅ Chat message saved to database');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving message:', error.message);
    return { success: false, error: error.message };
  }
};

export const loadChatHistory = async (userId, limit = 20) => {
  try {
    console.log('💬 Loading chat history for user:', userId);
    const { data, error } = await supabase
      .from('ai_conversations') // Correct: matches your schema
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const messages = data.map(row => ({
      role: row.message_type, // Correct: matches your schema
      content: row.content,
      timestamp: new Date(row.created_at),
      context: row.context // Correct: matches your schema
    }));

    console.log(`✅ Loaded ${messages.length} chat messages from database`);
    return { success: true, messages };
  } catch (error) {
    console.error('❌ Error loading chat history:', error.message);
    return { success: false, error: error.message, messages: [] };
  }
};

export const getRecentMessages = async (userId) => {
  try {
    console.log('💬 Getting recent messages for user:', userId);
    const { data, error } = await supabase
      .from('ai_conversations') // Correct: matches your schema
      .select('message_type, content') // Correct: matches your schema
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const messages = data.reverse().map(row => ({
      role: row.message_type, // Correct: matches your schema
      content: row.content
    }));

    console.log(`✅ Loaded ${messages.length} recent messages for AI context`);
    return messages;
  } catch (error) {
    console.error('❌ Error loading recent messages:', error.message);
    return [];
  }
};

// Goals Functions
export const saveGoal = async (userId, goal) => {
  try {
    console.log('🎯 Saving goal for user:', userId);
    const goalData = {
      user_id: userId, // Correct: matches your schema
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

    console.log('✅ Goal saved to database:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error saving goal:', error.message);
    return { success: false, error: error.message };
  }
};

export const loadGoals = async (userId) => {
  try {
    console.log('🎯 Loading goals for user:', userId);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId) // Correct: matches your schema
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log(`✅ Loaded ${data.length} goals from database`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error loading goals:', error.message);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateGoalProgress = async (goalId, progress) => {
  try {
    console.log('🎯 Updating goal progress for:', goalId);
    const { data, error } = await supabase
      .from('goals')
      .update({ 
        progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select();

    if (error) throw error;
    console.log('✅ Goal progress updated in database');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error updating goal progress:', error.message);
    return { success: false, error: error.message };
  }
};

// Tasks Functions
export const saveTask = async (userId, task) => {
  try {
    console.log('📋 Saving task for user:', userId);
    const taskData = {
      user_id: userId, // Correct: matches your schema
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

    console.log('✅ Task saved to database:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error saving task:', error.message);
    return { success: false, error: error.message };
  }
};

export const loadTasks = async (userId) => {
  try {
    console.log('📋 Loading tasks for user:', userId);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId) // Correct: matches your schema
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log(`✅ Loaded ${data.length} tasks from database`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error loading tasks:', error.message);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateTaskStatus = async (taskId, status, completedAt = null) => {
  try {
    console.log('📋 Updating task status for:', taskId);
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
    console.log('✅ Task status updated in database');
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error updating task status:', error.message);
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
    console.log('✅ Task deleted from database');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting task:', error.message);
    return { success: false, error: error.message };
  }
};

// Bulk save functions for initial onboarding
export const saveMultipleGoals = async (userId, goals) => {
  try {
    console.log('🎯 Saving multiple goals for user:', userId);
    const goalsToInsert = goals.map(goal => ({
      user_id: userId, // Correct: matches your schema
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
    console.log(`✅ Saved ${data.length} goals to database`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving multiple goals:', error.message);
    return { success: false, error: error.message };
  }
};

export const saveMultipleTasks = async (userId, tasks) => {
  try {
    console.log('📋 Saving multiple tasks for user:', userId);
    const tasksToInsert = tasks.map(task => ({
      user_id: userId, // Correct: matches your schema
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
    console.log(`✅ Saved ${data.length} tasks to database`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving multiple tasks:', error.message);
    return { success: false, error: error.message };
  }
};

export default supabase;
