import type { ApiGetResponse, ApiPostRequest, ApiPostResponse, ApiDeleteResponse } from '../types';

const API_BASE = '/api/notes';

export async function fetchNote(siteHash: string): Promise<ApiGetResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(siteHash)}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function saveNote(
  siteHash: string,
  data: ApiPostRequest
): Promise<ApiPostResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(siteHash)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 409) {
      return result as ApiPostResponse;
    }
    throw new Error(result.error || `HTTP ${response.status}`);
  }

  return result;
}

export async function deleteNote(siteHash: string): Promise<ApiDeleteResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(siteHash)}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
