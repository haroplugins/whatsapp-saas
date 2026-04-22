const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';
export const ACCESS_TOKEN_KEY = 'accessToken';

type JsonBody = Record<string, unknown>;

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | JsonBody | null;
};

type ApiErrorResponse = {
  message?: string | string[];
};

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(accessToken: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export async function apiFetch<T>(
  url: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const accessToken = getAccessToken();
  const requestBody = serializeRequestBody(options.body);

  if (requestBody.isJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    body: requestBody.value,
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload as T;
}

function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Request failed.';
  }

  const { message } = payload as ApiErrorResponse;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  return 'Request failed.';
}

function serializeRequestBody(body: ApiFetchOptions['body']): {
  isJson: boolean;
  value: BodyInit | null | undefined;
} {
  if (body === undefined || body === null) {
    return {
      isJson: false,
      value: body,
    };
  }

  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return {
      isJson: false,
      value: body,
    };
  }

  return {
    isJson: true,
    value: JSON.stringify(body),
  };
}
