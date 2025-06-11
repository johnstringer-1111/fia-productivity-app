// pages/api/ai-coach.js
// Debug version to identify the issue

export default async function handler(req, res) {
  console.log('🚀 AI Coach API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userGoals, userTasks } = req.body;
  console.log('📥 Received message:', message);
  console.log('🎯 User goals:', userGoals?.map(g => g.title));
  console.log('📋 User tasks:', userTasks?.map(t => t.title));

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Check if API key exists
  console.log('🔑 API Key exists:', !!process.env.CLAUDE_API_KEY);
  console.log('🔑 API Key starts with sk-ant:', process.env.CLAUDE_API_KEY?.startsWith('sk-ant'));

  try {
    const prompt = `You are F.I.A. (Focused Inspired Action), an AI productivity coach. 

User's Current Goals: ${userGoals?.map(g => g.title).join(', ') || 'None set'}
User's Recent Tasks: ${userTasks?.slice(0, 3).map(t => t.title).join(', ') || 'None'}

User Message: ${message}

Provide helpful, actionable productivity coaching. Be encouraging and specific. Keep responses under 150 words.`;

    console.log('📝 Sending prompt to Claude...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('📡 Claude API response status:', response.status);
    console.log('📡 Claude API response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API Error Response:', errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Claude API Success!');
    console.log('📤 Sending response back to frontend');
    
    return res.status(200).json({
      success: true,
      response: data.content[0].text
    });

  } catch (error) {
    console.error('💥 FULL ERROR DETAILS:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    // Return detailed error for debugging
    return res.status(200).json({
      success: false,
      response: "I'm here to help you stay productive! What's your most important task right now? Let's break it into smaller steps and get started! 💪",
      debug: {
        error: error.message,
        hasApiKey: !!process.env.CLAUDE_API_KEY,
        apiKeyFormat: process.env.CLAUDE_API_KEY?.substring(0, 10) + '...'
      }
    });
  }
}
