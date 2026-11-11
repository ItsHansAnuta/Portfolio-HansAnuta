export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Could not reach the publishing server. Check your connection and try again.');
  }
  let data;
  try { data = await response.json(); }
  catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('The publishing server is unavailable. This site needs the Node.js server to run the dashboard.');
  }
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}
