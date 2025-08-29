// Service file to interact with Grok AI via Netlify proxy
// Handles local dev and production environments

export async function getGrokAdvice(userData) {
  // Determine function URL based on environment
  const functionUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_URL || '/.netlify/functions/grok-proxy';
  console.log('Attempting to call Grok proxy at:', functionUrl);

  try {
    console.log('Calling grok-proxy with userData:', userData);
    // Make POST request to proxy
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData }),
    });

    console.log('Proxy response status:', response.status);
    // Get raw response text
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

    // Parse JSON
    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('Failed to parse proxy response:', parseError.message, 'Raw response:', rawResponse);
      throw new Error('Invalid response from proxy');
    }

    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch AI advice: ${response.statusText} (${response.status})`);
    }

    // Validate advice presence
    if (!data.advice) {
      throw new Error('No advice returned from Grok API');
    }

    return data.advice; // Return the advice string
  } catch (error) {
    console.error('Error calling Grok API proxy:', error.message);
    throw error; // Rethrow for caller handling
  }
}