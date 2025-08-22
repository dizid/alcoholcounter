// Netlify serverless function to proxy Grok AI API calls (hides API key)
exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse incoming body (expects { userData: [...] })
    const { userData } = JSON.parse(event.body);

    // System prompt as specified
    const systemPrompt = 'You are a professional addiction therapist. Give advice based on the users drinking habits and other submitted data.';

    // User message with data (stringify to send as text)
    const userMessage = `Here is the user data: ${JSON.stringify(userData)}`;

    // Grok API request (OpenAI-compatible format)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`, // Key from Netlify env vars
      },
      body: JSON.stringify({
        model: 'grok-4', // Use grok-4 for advanced reasoning; change if needed
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7, // Adjustable for creativity (0-1)
        max_tokens: 500, // Limit response length; adjust based on needs
      }),
    });

    const data = await response.json();

    // Check for API errors
    if (!response.ok) {
      throw new Error(data.error?.message || 'Grok API error');
    }

    // Extract AI response
    const aiAdvice = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ advice: aiAdvice }),
    };
  } catch (error) {
    console.error('Error in Grok proxy:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get AI advice' }),
    };
  }
};