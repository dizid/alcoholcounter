// Netlify serverless function to proxy Grok AI API calls (hides API key)
// Enhanced with timeout retry, exponential backoff, and detailed logging
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

    // Optimize prompt: Truncate historical counts to last 7 days and limit frequencies
    const optimizedCounts = Object.fromEntries(
      Object.entries(userData.historicalCounts || {})
        .sort()
        .slice(-7) // Last 7 days only
    );
    const optimizedFreq = {};
    for (const [key, value] of Object.entries(userData.contextFrequencies || {})) {
      optimizedFreq[key] = Object.fromEntries(
        Object.entries(value).slice(0, 3) // Top 3 contexts per category
      );
    }
    const optimizedData = {
      historicalCounts: optimizedCounts,
      contextFrequencies: optimizedFreq,
    };
    console.log('Optimized userData:', optimizedData);

    // System prompt for Grok: Structured, professional advice
    const systemPrompt = `
You are a professional addiction therapist specializing in alcohol moderation.
Provide empathetic, actionable advice based on the user's drinking habits.
Structure your response with Markdown formatting for readability:
- Use # for main headings (e.g., # Key Insights)
- Use paragraphs for explanations
- Use bullet points (-) for tips and recommendations
- Keep the response concise yet comprehensive (under 500 words)

Analyze the data:
- Identify trends in daily drink counts (e.g., increasing, decreasing, peaks on certain days)
- Highlight triggers from context frequencies (e.g., common moods, companies, locations linked to higher drinking)
- Suggest personalized strategies: e.g., alternatives for high-frequency triggers, goal-setting based on trends
- End with motivational encouragement
`.trim();

    // User message: Provide data and explicit instructions
    const userMessage = `
User's summarized data:
- Historical daily drink counts (last 7 days, date: count): ${JSON.stringify(optimizedCounts)}
- Context frequencies (top 3 per category): ${JSON.stringify(optimizedFreq)}

Based on this, provide insights on trends (e.g., average drinks, spikes), potential triggers (e.g., negative mood leading to more drinks), and 3-5 specific tips to reduce drinking.
`.trim();

    // Grok API request with retry and exponential backoff
    console.log('Making Grok API request with optimized userData:', optimizedData);
    let response;
    let attempt = 1;
    const maxAttempts = 3; // Increased to 3 attempts
    const baseTimeout = 12000; // 12s timeout per attempt
    while (attempt <= maxAttempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), baseTimeout);
      const startTime = Date.now();
      try {
        response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'grok-3',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
          signal: controller.signal,
        });
        console.log(`API request attempt ${attempt} took ${Date.now() - startTime}ms, status: ${response.status}`);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
        break; // Success, exit retry loop
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${attempt}):`, fetchError.message);
        if (fetchError.name === 'AbortError' && attempt < maxAttempts) {
          console.log(`Retrying after timeout, attempt ${attempt + 1}...`);
          attempt++;
          // Exponential backoff: wait 2s * (attempt number) before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        throw fetchError.name === 'AbortError'
          ? new Error('Grok API request timed out after retries')
          : fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    }

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

    // Log token usage
    console.log('Token usage:', data.usage);

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid Grok API response structure:', JSON.stringify(data, null, 2));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Failed to get AI advice: Invalid response structure: ${JSON.stringify(data)}` }),
      };
    }

    // Handle empty content
    const aiAdvice = data.choices[0].message.content || 'No specific advice generated; please try again.';
    if (!data.choices[0].message.content) {
      console.warn('Grok API returned empty content:', data);
    }

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