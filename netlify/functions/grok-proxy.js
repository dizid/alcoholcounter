
// Netlify serverless function to proxy Grok AI API calls (hides API key)
// Enhanced with detailed logging for request body and API response issues
exports.handler = async (event) => {
  // Log the full event for debugging
  console.log('Raw event:', JSON.stringify(event, null, 2));

  // Log environment variables for debugging
  console.log('Environment variables:', {
    GROK_API_KEY: process.env.GROK_API_KEY ? 'present' : 'missing',
  });

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.error('Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Check if body exists
    if (!event.body) {
      console.error('Request body is empty or undefined');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is empty' }),
      };
    }

    // Parse incoming body safely
    let requestBody;
    try {
      console.log('Raw request body:', event.body);
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body format' }),
      };
    }

    const { userData } = requestBody;
    if (!userData) {
      console.error('userData missing in request body');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userData is required' }),
      };
    }

    // Verify API key
    if (!process.env.GROK_API_KEY) {
      console.error('GROK_API_KEY environment variable is missing');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error: Missing API key' }),
      };
    }

    // System prompt for Grok
    const systemPrompt = 'You are a professional addiction therapist. Give advice based on the users drinking habits and other submitted data.';

    // User message with data
    const userMessage = `Here is the user data: ${JSON.stringify(userData)}`;

    // Grok API request
    console.log('Making Grok API request with userData:', userData);
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    // Parse API response
    let data;
    try {
      data = await response.json();
      console.log('Grok API response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Failed to parse Grok API response:', parseError.message);
      throw new Error('Invalid response format from Grok API');
    }

    // Check for API errors
    if (!response.ok) {
      console.error('Grok API error:', data.error?.message || response.statusText);
      throw new Error(data.error?.message || `Grok API error: ${response.status}`);
    }

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid Grok API response structure:', JSON.stringify(data, null, 2));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to get AI advice: Unexpected response format from Grok API: ${JSON.stringify(data)}` }),
      };
    }

    // Extract AI response
    const aiAdvice = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ advice: aiAdvice }),
    };
  } catch (error) {
    console.error('Error in Grok proxy:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to get AI advice: ${error.message}` }),
    };
  }
};
