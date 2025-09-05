// src/services/grok.js
// Original function to fetch Grok advice, with added debugging logs for maintainability
export async function getGrokAdvice(userData) {
  try {
    console.log('Fetching Grok advice with userData:', JSON.stringify(userData)); // Debug: Log input data
    const response = await fetch('/.netlify/functions/grok-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, requestType: 'mainAdvice' })
    })
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`) // Original error handling intact
    }
    const data = await response.json()
    console.log('Grok response data:', JSON.stringify(data)); // Debug: Log full response for tracing
    if (data.error) {
      throw new Error(data.error)
    }
    return data.advice || 'No advice received.' // Original fallback intact
  } catch (error) {
    console.error('Error fetching Grok advice:', error) // Original logging intact
    throw error // Let caller handle, as in original
  }
}

// Original mindfulness tip function remains unchanged for modularity
export async function getMindfulnessTip(triggers) {
  try {
    const response = await fetch('/.netlify/functions/grok-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData: { triggers }, requestType: 'mindfulnessTip' })
    })
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    const data = await response.json()
    if (data.error) {
      throw new Error(data.error)
    }
    return data.response || 'No tip received.'
  } catch (error) {
    console.error('Error fetching mindfulness tip:', error)
    throw error
  }
}