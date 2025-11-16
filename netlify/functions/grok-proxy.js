// netlify/functions/grok-proxy.js
// Netlify serverless function to proxy requests to Grok AI API
// Updated to use faster 'grok-3' model and restore structured short paragraphs
// Prompt enhanced for all user data with concise sections
// WITH QUOTA ENFORCEMENT - Checks user tier and usage before allowing AI calls
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role for quota checking
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Check user's quota before allowing AI call
 * Returns { allowed: boolean, quotaInfo: object }
 */
async function checkQuota(userId) {
  try {
    // Get user's quota info using SQL function
    const { data, error } = await supabase.rpc('get_user_quota_info', {
      p_user_id: userId
    })

    if (error) {
      console.error('Quota check error:', error)
      // On error, allow the call (fail open)
      return { allowed: true, quotaInfo: null }
    }

    const quotaInfo = data || {}
    const hasQuota = quotaInfo.remaining > 0

    console.log('Quota check for user:', userId, quotaInfo)

    return {
      allowed: hasQuota,
      quotaInfo: quotaInfo
    }
  } catch (error) {
    console.error('Quota check exception:', error)
    // Fail open
    return { allowed: true, quotaInfo: null }
  }
}

/**
 * Track AI usage after successful call
 */
async function trackUsage(userId, requestType, tokensUsed) {
  try {
    const { error } = await supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        request_type: requestType === 'mainAdvice' ? 'dashboard' : 'mindfulness',
        tokens_input: 0,
        tokens_output: tokensUsed || 0,
        cost_estimate: (tokensUsed || 0) * 15.00 / 1_000_000 // $15 per million tokens
      })

    if (error) {
      console.error('Failed to track usage:', error)
      // Non-critical, don't fail the request
    } else {
      console.log('Usage tracked for user:', userId, requestType)
    }
  } catch (error) {
    console.error('Usage tracking exception:', error)
  }
}

/**
 * Get user ID from request (from Authorization header)
 */
async function getUserIdFromRequest(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('Failed to get user from token:', error)
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error extracting user ID:', error)
    return null
  }
}

exports.handler = async (event) => {
  console.log('Function invoked at:', new Date().toISOString())
  console.log('Raw event:', JSON.stringify(event, null, 2))

  console.log('Environment variables:', {
    GROK_API_KEY: process.env.GROK_API_KEY ? 'present' : 'missing',
  })

  const sendResponse = (statusCode, body) => {
    console.log('Sending response:', { statusCode, body })
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  }

  if (event.httpMethod !== 'POST') {
    console.error('Invalid method:', event.httpMethod)
    return sendResponse(405, { error: 'Method Not Allowed' })
  }

  try {
    if (!event.body) {
      console.error('Request body is empty or undefined')
      return sendResponse(400, { error: 'Request body is empty' })
    }
    let requestBody
    try {
      console.log('Raw request body:', event.body)
      requestBody = JSON.parse(event.body)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError.message)
      return sendResponse(400, { error: 'Invalid request body format' })
    }

    if (!process.env.GROK_API_KEY) {
      console.error('GROK_API_KEY environment variable is missing')
      return sendResponse(500, { error: 'Server configuration error: Missing API key' })
    }

    const { userData, requestType } = requestBody
    if (!requestType) {
      return sendResponse(400, { error: 'Missing requestType' })
    }

    // QUOTA ENFORCEMENT: Get user ID and check quota
    const userId = await getUserIdFromRequest(event)
    if (!userId) {
      console.warn('No user ID found, proceeding without quota check')
      // For backward compatibility, allow calls without auth (will add auth requirement later)
    } else {
      const { allowed, quotaInfo } = await checkQuota(userId)
      if (!allowed) {
        return sendResponse(429, {
          error: 'Quota exceeded',
          message: `You've used all ${quotaInfo.quota_limit} AI insights this month. ${quotaInfo.tier === 'free' ? 'Upgrade to Premium for 100 insights!' : 'Your quota resets soon.'}`,
          quotaInfo: quotaInfo
        })
      }
    }

    // Restored prompt for structured short paragraphs using all user data
    const prompt = `Provide personalized ${requestType} based on the user's full data:
- Triggers: ${JSON.stringify(userData.triggers || [])}
- Historical Drinking Patterns: ${JSON.stringify(userData.historicalDrinkingPatterns || {})}
- Context Frequencies: ${JSON.stringify(userData.contextFrequencies || {})}
- Reflections: ${JSON.stringify(userData.reflections || [])}

Structure the advice in short paragraphs (1-2 sentences each) with sections: 
1. Triggers Analysis
2. Drinking Patterns Insights
3. Reflections Summary
4. Personalized Tips

Keep it encouraging, concise, and supportive, aligned with CBT principles.`;

    console.log('Sending optimized prompt to API:', prompt);

    // Use faster 'grok-3' model for SuperGrok to reduce timeouts
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3', // Faster model for SuperGrok
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API error:', response.status, errorText);
      return sendResponse(500, { error: `Grok API error: ${response.status} - ${errorText}` });
    }

    let data;
    try {
      const responseText = await response.text()
      console.log('Raw Grok API response:', responseText)
      data = JSON.parse(responseText)
      console.log('Parsed Grok API response:', JSON.stringify(data, null, 2))
    } catch (parseError) {
      console.error('Failed to parse Grok API response:', parseError.message)
      return sendResponse(500, { error: 'Invalid response format from Grok API' })
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid Grok API response structure:', JSON.stringify(data, null, 2))
      return sendResponse(500, { error: 'Invalid response structure from Grok API' })
    }

    const aiResponse = data.choices[0].message.content || 'No specific response generated; please try again.'
    if (!data.choices[0].message.content) {
      console.warn('Grok API returned empty content:', data)
    }

    // Track usage after successful AI call
    if (userId) {
      const tokensUsed = data.usage?.completion_tokens || 500 // Estimate if not provided
      await trackUsage(userId, requestType, tokensUsed)
    }

    return sendResponse(200, {
      [requestType === 'mainAdvice' ? 'advice' : 'response']: aiResponse
    });
  } catch (error) {
    console.error('Error in Grok proxy:', error.message, error.stack)
    return sendResponse(500, { error: `Failed to get AI response: ${error.message}` })
  }
}