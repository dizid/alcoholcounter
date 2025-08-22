// Service to call Grok AI via Netlify proxy
export async function getGrokAdvice(userData) {
  try {
    const response = await fetch('/.netlify/functions/grok-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI advice');
    }

    const { advice } = await response.json();
    return advice;
  } catch (error) {
    console.error('Error calling Grok API proxy:', error);
    throw error;
  }
}