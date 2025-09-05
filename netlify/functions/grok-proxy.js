// Netlify serverless function to proxy requests to Grok AI API
// Includes robust error handling, logging, retries, and optimized prompts for efficiency

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

    // Determine request type (main advice or mindfulness tip)
    const { userData, requestType } = requestBody
    if (!requestType) {
      console.error('requestType missing in request body')
      return sendResponse(400, { error: 'requestType is required' })
    }

    let systemPrompt, userMessage

    if (requestType === 'mindfulnessTip') {
      // New endpoint for mindfulness tips
      const triggers = (userData?.triggers || []).slice(0, 5).map(trig => ({
        trigger_text: trig.trigger_text,
        created_at: trig.created_at
      }))
      systemPrompt = `
You are a mindfulness expert specializing in alcohol moderation, with expertise in Mindfulness-Based Relapse Prevention (MBRP).
Provide a single, concise, actionable mindfulness tip (50-100 words) to help manage alcohol cravings, tailored to the user's recent triggers.
Use simple, empathetic language and focus on one specific strategy (e.g., breathing, acceptance, urge surfing).
If no triggers are provided, suggest a general mindfulness tip.
`.trim()
      userMessage = `
User's recent triggers (top 5, text and date): ${JSON.stringify(triggers)}
Provide a mindfulness tip tailored to these triggers, or a general tip if none are provided.
`.trim()
    } else if (requestType === 'mainAdvice') {
      // Existing main advice logic
      if (!userData) {
        console.error('userData missing in request body')
        return sendResponse(400, { error: 'userData is required' })
      }
      const optimizedCounts = Object.fromEntries(
        Object.entries(userData.historicalCounts || {})
          .sort()
          .slice(-7)
      )
      const optimizedFreq = {}
      for (const [key, value] of Object.entries(userData.contextFrequencies || {})) {
        optimizedFreq[key] = Object.fromEntries(
          Object.entries(value).slice(0, 3)
        )
      }
      const optimizedTriggers = (userData.userTriggers || []).slice(0, 5).map(trig => ({
        trigger_text: trig.trigger_text,
        created_at: trig.created_at
      }))
      const optimizedData = {
        historicalCounts: optimizedCounts,
        contextFrequencies: optimizedFreq,
        userTriggers: optimizedTriggers
      }
      console.log('Optimized userData:', optimizedData)
      systemPrompt = `
You are a professional addiction therapist specializing in alcohol moderation, with expertise in Cognitive Behavioral Therapy (CBT) and Mindfulness-Based Relapse Prevention (MBRP).
Provide concise, empathetic, actionable advice based on the user's drinking habits, blending CBT and mindfulness techniques, with a focus on AI-driven trigger analysis.
Structure your response with Markdown formatting for readability:
- Use # for main headings (e.g., # Key Insights)
- Use short paragraphs for explanations
- Use bullet points (-) for 2-3 key tips, including 1-2 CBT strategies (e.g., trigger identification, thought reframing, skills training) and 1-2 mindfulness strategies (e.g., present-moment awareness, acceptance, urge surfing)
- Keep the response brief (150-200 words)
Analyze the data:
- Identify key trends in daily drink counts (e.g., average, spikes)
- Highlight one or two main triggers from context frequencies (e.g., mood, location) and user-entered triggers (e.g., recurring patterns like 'stress' or 'social events')
- Suggest 2-3 specific strategies to reduce drinking, combining CBT (e.g., reframing negative thoughts, planning alternatives for triggers) and mindfulness (e.g., breathing exercises, urge surfing), tailored to the identified triggers
- End with brief motivational encouragement
`.trim()
      userMessage = `
User's summarized data:
- Historical daily drink counts (last 7 days, date: count): ${JSON.stringify(optimizedCounts)}
- Context frequencies (top 3 per category): ${JSON.stringify(optimizedFreq)}
- User-entered triggers (top 5 recent, text and date): ${JSON.stringify(optimizedTriggers)}
Based on this, provide a brief analysis of trends, one or two triggers (including from user-entered), and 2-3 specific strategies combining CBT and mindfulness to reduce drinking.
`.trim()
    } else {
      console.error('Invalid requestType:', requestType)
      return sendResponse(400, { error: 'Invalid requestType' })
    }

    // Make API request with retries and timeout
    console.log('Making Grok API request:', { requestType })
    let response
    let attempt = 1
    const maxAttempts = 3
    const baseTimeout = 30000
    while (attempt <= maxAttempts) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), baseTimeout)
      const startTime = Date.now()
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
            max_tokens: requestType === 'mindfulnessTip' ? 150 : 300,
          }),
          signal: controller.signal,
        })
        console.log(`API request attempt ${attempt} took ${Date.now() - startTime}ms, status: ${response.status}`)
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
        }
        break
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${attempt}):`, fetchError.message)
        if (fetchError.name === 'AbortError' && attempt < maxAttempts) {
          console.log(`Retrying after timeout, attempt ${attempt + 1}...`)
          attempt++
          await new Promise(resolve => setTimeout(resolve, 5000 * attempt))
          continue
        }
        throw fetchError.name === 'AbortError'
          ? new Error('Grok API request timed out after retries')
          : fetchError
      } finally {
        clearTimeout(timeoutId)
      }
    }

    // Parse response body
    let data
    try {
      const responseText = await response.text()
      console.log('Raw Grok API response:', responseText)
      data = JSON.parse(responseText)
      console.log('Parsed Grok API response:', JSON.stringify(data, null, 2))
    } catch (parseError) {
      console.error('Failed to parse Grok API response:', parseError.message)
      return sendResponse(500, { error: 'Invalid response format from Grok API' })
    }

    if (!response.ok) {
      console.error('Grok API error:', data.error?.message || response.statusText)
      return sendResponse(500, { error: data.error?.message || `Grok API error: ${response.status}` })
    }

    console.log('Token usage:', data.usage)

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid Grok API response structure:', JSON.stringify(data, null, 2))
      return sendResponse(500, { error: 'Invalid response structure from Grok API' })
    }

    const aiResponse = data.choices[0].message.content || 'No specific response generated; please try again.'
    if (!data.choices[0].message.content) {
      console.warn('Grok API returned empty content:', data)
    }

    return sendResponse(200, { response: aiResponse })
  } catch (error) {
    console.error('Error in Grok proxy:', error.message, error.stack)
    return sendResponse(500, { error: `Failed to get AI response: ${error.message}` })
  }
}