// Service to call Grok AI via Netlify proxy
// Supports local (netlify dev) and production environments
export async function getGrokAdvice(userData) {
  // Use environment-specific function URL
  const functionUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || '/.netlify/functions/grok-proxy';

  try {
    console.log('Calling grok-proxy with userData:', userData); // Debug: inspect input
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch AI advice: ${response.statusText} (${response.status})`);
    }

    if (!data.advice) {
      throw new Error('No advice returned from Grok API');
    }

    return data.advice;
  } catch (error) {
    console.error('Error calling Grok API proxy:', error.message);
    throw error;
  }
}