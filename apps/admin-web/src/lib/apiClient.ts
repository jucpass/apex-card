import type { Session } from '@supabase/supabase-js';

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  session: Session | null,
  options?: RequestInit
): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      ...options,
    });
  } catch {
    throw new ApiError(0, `Could not reach the API at ${url}.`);
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, error?.message ?? `Request failed at ${url}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Multipart upload variant — deliberately omits the `Content-Type` header so the browser
 * sets the correct `multipart/form-data; boundary=...` value itself.
 */
export async function apiUpload<T>(
  path: string,
  session: Session | null,
  formData: FormData,
  options?: Omit<RequestInit, 'body'>
): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: formData,
      ...options,
    });
  } catch {
    throw new ApiError(0, `Could not reach the API at ${url}.`);
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, error?.message ?? `Request failed at ${url}.`);
  }

  return response.json() as Promise<T>;
}
