const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export type ApiError = {
  message: string;
  status?: number;
};

function extractErrorMessage(payload: any): string {
  if (!payload) {
    return 'Request failed';
  }

  const normalizeFieldErrorMessage = (message: string) => {
    const trimmed = message.trim();
    const withoutFieldPrefix = trimmed.replace(/^[a-zA-Z0-9_.-]+:\s*/, '');
    return withoutFieldPrefix.charAt(0).toUpperCase() + withoutFieldPrefix.slice(1);
  };

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload.error === 'string') {
    return payload.error
      .split(/\r?\n+/)
      .map(normalizeFieldErrorMessage)
      .join('\n');
  }

  if (typeof payload.message === 'string') {
    return normalizeFieldErrorMessage(payload.message);
  }

  if (typeof payload.detail === 'string') {
    return normalizeFieldErrorMessage(payload.detail);
  }

  if (typeof payload['hydra:description'] === 'string') {
    return normalizeFieldErrorMessage(payload['hydra:description']);
  }

  if (Array.isArray(payload.violations) && payload.violations.length > 0) {
    return payload.violations
      .map((violation: { propertyPath?: string; message?: string }) => {
        return normalizeFieldErrorMessage(violation.message ?? 'Invalid value');
      })
      .join('\n');
  }

  return 'Request failed';
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const jwt = localStorage.getItem('jwt');
  const { auth = true, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/ld+json',
      ...((jwt && auth) ? { Authorization: `Bearer ${jwt}` } : {}),
      ...(fetchOptions.headers ?? {}),
    },
    ...fetchOptions,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') || contentType.includes('application/ld+json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const errorMessage = extractErrorMessage(payload);
    throw { message: errorMessage, status: response.status } satisfies ApiError;
  }

  return payload as T;
}

export const apiClient = {
  login: (email: string, password: string) =>
    request<{ token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ id?: number; email?: string; roles?: string[]; accountType?: string; firstName?: string; lastName?: string; companyName?: string; phone?: string; createdAt?: string }>('/user', {
    method: 'GET',
  }),

  registerCustomer: (data: Record<string, unknown>) =>
    request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerPartner: (data: Record<string, unknown>) =>
    request('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTrips: (filters?: {
    departureCity?: string;
    arrivalCity?: string;
    departureTime?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.departureCity) params.set('departureCity', filters.departureCity);
    if (filters?.arrivalCity) params.set('arrivalCity', filters.arrivalCity);
    if (filters?.departureTime) params.set('departureTime', filters.departureTime);

    const query = params.toString();
    
    return request(`/trips${query ? `?${query}` : ''}`, {
      auth: false,
    });
  },

  getCities: () =>
    request<{ id?: number; name?: string }[] | { 'hydra:member'?: { id?: number; name?: string }[] }>(
      '/cities',
      {
        auth: false,
      },
    ),
};