// src/services/grok.js
// Calls the grok-proxy Netlify function for AI advice and mindfulness tips.
// The function only answers signed-in users (T-0586), so every request carries
// the Firebase ID token, like the other API calls in services/db.js.
import { getIdToken } from '../firebase'

// POSTs one AI request and returns the parsed JSON body.
// On an error status the server's own message (e.g. "You've used today's 20 AI
// answers...") is thrown, so the views can show it instead of "HTTP error: 429".
async function askAi(requestType, userData) {
  const token = await getIdToken()
  const response = await fetch('/.netlify/functions/grok-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userData, requestType }),
  })
  if (!response.ok) {
    let message = `HTTP error: ${response.status}`
    try {
      const body = await response.json()
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      // No JSON body: keep the status message
    }
    throw new Error(message)
  }
  const data = await response.json()
  if (data.error) {
    throw new Error(data.error)
  }
  return data
}

// Personalized advice for the Dashboard
export async function getGrokAdvice(userData) {
  try {
    const data = await askAi('mainAdvice', userData)
    return data.advice || 'No advice received.'
  } catch (error) {
    console.error('Error fetching Grok advice:', error)
    throw error // Let caller handle
  }
}

// Mindfulness tip for the tracker's support tools
export async function getMindfulnessTip(triggers) {
  try {
    const data = await askAi('mindfulnessTip', { triggers })
    return data.response || 'No tip received.'
  } catch (error) {
    console.error('Error fetching mindfulness tip:', error)
    throw error
  }
}
