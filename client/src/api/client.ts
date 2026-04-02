import type { ApiGetResponse, ApiPostRequest, ApiPostResponse, ApiDeleteResponse } from '../types';

const API_BASE = '/api/notes';

async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Server returned non-JSON response (${response.status}). ` +
      `The API server may not be running. Response: ${text.slice(0, 100)}`
    );
  }
  return response.json();
}

export async function fetchNote(siteHash: string): Promise<ApiGetResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(siteHash)}`);
  if (!response.ok) {
    const error = await parseJsonResponse(response).catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error((error as { error?: string }).error || `HTTP ${response.status}`);
  }
  return parseJsonResponse(response) as Promise<ApiGetResponse>;
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

  const result = await parseJsonResponse(response);

  if (!response.ok) {
    if (response.status === 409) {
      return result as ApiPostResponse;
    }
    const errObj = result as { error?: string };
    throw new Error(errObj.error || `HTTP ${response.status}`);
  }

  return result as ApiPostResponse;
}

export async function deleteNote(siteHash: string): Promise<ApiDeleteResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(siteHash)}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await parseJsonResponse(response).catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error((error as { error?: string }).error || `HTTP ${response.status}`);
  }
  return parseJsonResponse(response) as Promise<ApiDeleteResponse>;
}
