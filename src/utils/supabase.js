// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generate or get persistent user ID
export const getUserId = () => {
  let userId = localStorage.getItem('fia_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('fia_user_id', userId);
  }
  return userId;
};

// Save a chat message to database
export const saveChatMessage = async (messageType, content, context = {}) => {
  try {
    const userId = getUserId();
    const conversationId = localStorage.getItem('fia_conversation_id') || 
                          `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store conversation ID for this session
    localStorage.setItem('fia_conversation_id', conversationId);

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert([{
        user_id: userId,
        conversation_id: conversationId,
        message_type: messageType, // 'user' or 'assistant'
        content: content,
        context: context,
        voice_input: false
      }]);

    if (error) {
      console.error('Error saving message:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error };
  }
};

// Load conversation history
export const loadChatHistory = async (limit = 20) => {
  try {
    const userId = getUserId();
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading chat history:', error);
      return { success: false, error };
    }

    // Convert to your app's message format
    const messages = data.map(row => ({
      role: row.message_type,
      content: row.content,
      timestamp: new Date(row.created_at),
      context: row.context
    }));

    return { success: true, messages };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error };
  }
};

// Get recent messages for AI context (last 5 messages)
export const getRecentMessages = async () => {
  try {
    const userId = getUserId();
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('message_type, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading recent messages:', error);
      return [];
    }

    // Return in chronological order for AI context
    return data.reverse().map(row => ({
      role: row.message_type,
      content: row.content
    }));
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
};
