// Service to call Grok AI via Netlify proxy
// Supports local (netlify dev) and production environments
// Calls the standard function grok-proxy

export async function getGrokAdvice(userData) {
  // Use environment-specific function URL for the standard function
  const functionUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || '/.netlify/functions/grok-proxy';

  try {
    console.log('Calling grok-proxy with userData:', userData);
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData }),
    });

    // Log raw response for debugging
    const rawResponse = await response.text();
    console.log('Raw proxy response:', rawResponse);

    // Handle empty response
    if (!rawResponse) {
      throw new Error('Empty response from proxy. Check Netlify function logs.');
    }

    // Handle 404 explicitly
    if (response.status === 404) {
      throw new Error('Grok proxy function not found. Check Netlify function deployment.');
    }

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('Failed to parse proxy response:', parseError.message, 'Raw response:', rawResponse);
      throw new Error('Invalid response from proxy');
    }

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