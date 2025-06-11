// api/ai-coach.js
export default async function handler(req, res) {
  console.log('🚀 AI Coach API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userGoals, userTasks, onboardingData } = req.body;
  console.log('📥 Received message:', message);

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log('🔑 API Key exists:', !!process.env.CLAUDE_API_KEY);

  try {
    const prompt = `You are F.I.A. (Focused Inspired Action), an AI productivity coach.

CURRENT USER CONTEXT:
• Goals: ${userGoals?.map(g => g.title).join(', ') || 'None set'}
• Recent Tasks: ${userTasks?.slice(0, 3).map(t => t.title).join(', ') || 'None'}

USER PREFERENCES & STYLE:
• Work Style: ${onboardingData?.workStyle || 'Not specified'}
• Top Priorities: ${onboardingData?.priorities || 'Not specified'}
• Main Challenges: ${onboardingData?.challenges?.join(', ') || 'Not specified'}
• 90-Day Goals: ${onboardingData?.goals || 'Not specified'}
• Best Work Time: ${onboardingData?.schedule || 'Not specified'}
• Accountability Style: ${onboardingData?.accountability?.join(', ') || 'Not specified'}

USER MESSAGE: ${message}

Based on their personal work style and challenges, provide specific, actionable productivity coaching. Reference their preferences when relevant. Keep responses under 150 words and be encouraging.`;

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API Error Response:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Claude API Success!');
    
    return res.status(200).json({
      success: true,
      response: data.content[0].text
    });

  } catch (error) {
    console.error('💥 Error:', error.message);
    
    return res.status(200).json({
      success: true,
      response: "I'm here to help you stay productive! What's your most important task right now? Let's break it into smaller steps and get started! 💪"
    });
  }
}
