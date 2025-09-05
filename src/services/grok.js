export async function getGrokAdvice(userData) {
  try {
    const response = await fetch('/.netlify/functions/grok-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, requestType: 'mainAdvice' })
    })
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    const data = await response.json()
    if (data.error) {
      throw new Error(data.error)
    }
    return data.advice || 'No advice received.'
  } catch (error) {
    console.error('Error fetching Grok advice:', error)
    throw error
  }
}

// New function: Fetch a mindfulness tip
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