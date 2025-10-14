import { JWT } from 'next-auth/jwt';

const API_BASE_URL = process.env.API_BASE_URL;

export async function authenticatedFetch(url: string, token: JWT, options: RequestInit = {}) {
  const authToken = token?.accessToken;

  if (!authToken) {
    throw new Error('Not authenticated: No access token found');
  }

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
    throw new Error(errorData.error || 'API request failed');
  }

  return response.json();
}
