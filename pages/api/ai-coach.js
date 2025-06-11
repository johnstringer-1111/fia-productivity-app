// pages/api/ai-coach.js
// Simple single endpoint for AI coaching

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userGoals, userTasks } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Simple prompt with user context
    const prompt = `You are F.I.A. (Focused Inspired Action), an AI productivity coach. 

User's Current Goals: ${userGoals?.map(g => g.title).join(', ') || 'None set'}
User's Recent Tasks: ${userTasks?.slice(0, 3).map(t => t.title).join(', ') || 'None'}

User Message: ${message}

Provide helpful, actionable productivity coaching. Be encouraging and specific. Keep responses under 150 words.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Faster, cheaper model
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      response: data.content[0].text
    });

  } catch (error) {
    console.error('AI Error:', error);
    
    // Simple fallback response
    return res.status(200).json({
      success: true,
      response: "I'm here to help you stay productive! What's your most important task right now? Let's break it into smaller steps and get started! 💪"
    });
  }
}
