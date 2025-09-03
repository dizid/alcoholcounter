// Netlify serverless function to proxy requests to Grok AI API
// Includes robust error handling, logging, retries, and optimized prompts for efficiency

exports.handler = async (event) => {
  // Log invocation details for debugging
  console.log('Function invoked at:', new Date().toISOString())
  console.log('Raw event:', JSON.stringify(event, null, 2))

  // Log environment variables (mask sensitive ones)
  console.log('Environment variables:', {
    GROK_API_KEY: process.env.GROK_API_KEY ? 'present' : 'missing',
  })

  // Helper function to send consistent JSON responses
  const sendResponse = (statusCode, body) => {
    console.log('Sending response:', { statusCode, body })
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  }

  // Restrict to POST method only
  if (event.httpMethod !== 'POST') {
    console.error('Invalid method:', event.httpMethod)
    return sendResponse(405, { error: 'Method Not Allowed' })
  }

  try {
    // Validate and parse request body
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

    const { userData } = requestBody
    if (!userData) {
      console.error('userData missing in request body')
      return sendResponse(400, { error: 'userData is required' })
    }

    // Check for API key in environment
    if (!process.env.GROK_API_KEY) {
      console.error('GROK_API_KEY environment variable is missing')
      return sendResponse(500, { error: 'Server configuration error: Missing API key' })
    }

    // Optimize data for prompt: Limit to last 7 days and top 3 contexts to reduce tokens/costs
    const optimizedCounts = Object.fromEntries(
      Object.entries(userData.historicalCounts || {})
        .sort()
        .slice(-7) // Last 7 days
    )
    const optimizedFreq = {}
    for (const [key, value] of Object.entries(userData.contextFrequencies || {})) {
      optimizedFreq[key] = Object.fromEntries(
        Object.entries(value).slice(0, 3) // Top 3 per category
      )
    }
    const optimizedData = {
      historicalCounts: optimizedCounts,
      contextFrequencies: optimizedFreq,
    }
    console.log('Optimized userData:', optimizedData)

    // Updated system prompt to incorporate mindfulness-based approaches
    const systemPrompt = `
You are a professional addiction therapist specializing in alcohol moderation, with expertise in mindfulness-based interventions like Mindfulness-Based Relapse Prevention (MBRP).
Provide concise, empathetic, actionable advice based on the user's drinking habits, emphasizing mindfulness.
Structure your response with Markdown formatting for readability:
- Use # for main headings (e.g., # Key Insights)
- Use short paragraphs for explanations
- Use bullet points (-) for 2-3 key tips, including present-moment awareness, acceptance strategies, and urge surfing
- Keep the response brief (150-200 words)

Analyze the data:
- Identify key trends in daily drink counts (e.g., average, spikes)
- Highlight one or two main triggers from context frequencies (e.g., mood, location)
- Suggest 2-3 specific mindfulness strategies to reduce drinking, such as breathing exercises, acceptance of urges, or present-moment awareness
- End with brief motivational encouragement
`.trim()

    // Define user message with optimized data
    const userMessage = `
User's summarized data:
- Historical daily drink counts (last 7 days, date: count): ${JSON.stringify(optimizedCounts)}
- Context frequencies (top 3 per category): ${JSON.stringify(optimizedFreq)}

Based on this, provide a brief analysis of trends, one or two triggers, and 2-3 specific mindfulness strategies to reduce drinking.
`.trim()

    // Make API request with retries and timeout
    console.log('Making Grok API request with optimized userData:', optimizedData)
    let response
    let attempt = 1
    const maxAttempts = 3 // Max retry attempts
    const baseTimeout = 30000 // 30s timeout per attempt
    while (attempt <= maxAttempts) {
      const controller = new AbortController() // For timeout control
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
            model: 'grok-3', // Specify Grok model
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.7, // Balanced creativity
            max_tokens: 300, // Reduced for shorter response
          }),
          signal: controller.signal, // Attach abort signal
        })
        console.log(`API request attempt ${attempt} took ${Date.now() - startTime}ms, status: ${response.status}`)
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
        }
        break // Success: exit loop
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${attempt}):`, fetchError.message)
        if (fetchError.name === 'AbortError' && attempt < maxAttempts) {
          console.log(`Retrying after timeout, attempt ${attempt + 1}...`)
          attempt++
          await new Promise(resolve => setTimeout(resolve, 5000 * attempt)) // Exponential backoff
          continue
        }
        throw fetchError.name === 'AbortError'
          ? new Error('Grok API request timed out after retries')
          : fetchError
      } finally {
        clearTimeout(timeoutId) // Clean up timeout
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

    // Handle API errors
    if (!response.ok) {
      console.error('Grok API error:', data.error?.message || response.statusText)
      return sendResponse(500, { error: data.error?.message || `Grok API error: ${response.status}` })
    }

    // Log usage for monitoring costs
    console.log('Token usage:', data.usage)

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid Grok API response structure:', JSON.stringify(data, null, 2))
      return sendResponse(500, { error: 'Invalid response structure from Grok API' })
    }

    // Handle empty content gracefully
    const aiAdvice = data.choices[0].message.content || 'No specific advice generated; please try again.'
    if (!data.choices[0].message.content) {
      console.warn('Grok API returned empty content:', data)
    }

    // Return success response
    return sendResponse(200, { advice: aiAdvice })
  } catch (error) {
    console.error('Error in Grok proxy:', error.message, error.stack)
    return sendResponse(500, { error: `Failed to get AI advice: ${error.message}` })
  }
}