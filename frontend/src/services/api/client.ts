const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

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

function clearExpiredSession() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('email');
  localStorage.removeItem('accountType');
  localStorage.removeItem('firstName');
  localStorage.removeItem('lastName');
  localStorage.removeItem('companyName');
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, ...fetchOptions } = options;
  const jwt = auth ? localStorage.getItem('jwt') : null;
  const isAbsolutePath = /^https?:\/\//i.test(path);
  const requestUrl = isAbsolutePath ? path : `${API_BASE_URL}${path}`;
  const requestHeaders = new Headers(fetchOptions.headers);
  requestHeaders.set('Content-Type', requestHeaders.get('Content-Type') ?? 'application/ld+json');
  if (auth && jwt) {
    requestHeaders.set('Authorization', `Bearer ${jwt}`);
  }

  const response = await fetch(requestUrl, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') || contentType.includes('application/ld+json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const errorMessage = extractErrorMessage(payload);
    // Keep the existing session on ordinary API errors. A failed profile update
    // must not log the user out or erase their local profile data.
    if (response.status === 401 && path === '/user') {
      clearExpiredSession();
    }
    throw { message: errorMessage, status: response.status } satisfies ApiError;
  }

  return payload as T;
}

function normalizeApiPath(path: string) {
  return path.replace(/^\/api(?=\/)/, '');
}

function normalizeResourceIri(iri: string) {
  if (/^https?:\/\//i.test(iri)) {
    const url = new URL(iri);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return normalizeApiPath(iri);
}

export const apiClient = {
  login: (email: string, password: string) =>
    request<{ token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ '@id'?: string; id?: number; email?: string; roles?: string[]; accountType?: string; firstName?: string; lastName?: string; companyName?: string; phone?: string; address?: string; description?: string; createdAt?: string }>('/user', {
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
    request<{ id?: number; name?: string; label?: string; title?: string }[] | { member?: { id?: number; name?: string; label?: string; title?: string }[]; 'hydra:member'?: { id?: number; name?: string; label?: string; title?: string }[] }>(
      '/cities?itemsPerPage=1000',
      {
        auth: false,
      },
    ),

  getPartnerVehicles: () =>
    request<{ id?: number; '@id'?: string; brand?: string; licensePlate?: string; seatCapacity?: number; driverName?: string }[] | { member?: { id?: number; '@id'?: string; brand?: string; licensePlate?: string; seatCapacity?: number; driverName?: string }[]; 'hydra:member'?: { id?: number; '@id'?: string; brand?: string; licensePlate?: string; seatCapacity?: number; driverName?: string }[] }>('/vehicles?itemsPerPage=1000', {
      method: 'GET',
    }),

  getPartnerRoutes: () =>
    request<{ id?: number; '@id'?: string; departureCity?: { name?: string } | string; destinationCity?: { name?: string } | string }[] | { member?: { id?: number; '@id'?: string; departureCity?: { name?: string } | string; destinationCity?: { name?: string } | string }[]; 'hydra:member'?: { id?: number; '@id'?: string; departureCity?: { name?: string } | string; destinationCity?: { name?: string } | string }[] }>('/routes?itemsPerPage=1000', {
      method: 'GET',
    }),

  createRoute: (data: { departureCity: string; destinationCity: string }) =>
    request<{ id?: number; '@id'?: string; departureCity?: { name?: string }; destinationCity?: { name?: string } }>('/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/ld+json' },
      body: JSON.stringify(data),
    }),

  updateRoute: (iri: string, data: { departureCity: string; destinationCity: string }) =>
    request<{ id?: number; '@id'?: string; departureCity?: { name?: string }; destinationCity?: { name?: string } }>(normalizeResourceIri(iri), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    }),

  deleteRoute: (iri: string) =>
    request<void>(normalizeResourceIri(iri), { method: 'DELETE' }),

  createVehicle: (data: { brand: string; licensePlate: string; seatCapacity: number; driverName: string }) =>
    request<{ id?: number; '@id'?: string; brand?: string; licensePlate?: string; seatCapacity?: number; driverName?: string }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateVehicle: (iri: string, data: { brand: string; licensePlate: string; seatCapacity: number; driverName: string }) =>
    request<{ id?: number; '@id'?: string; brand?: string; licensePlate?: string; seatCapacity?: number; driverName?: string }>(normalizeResourceIri(iri), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    }),

  deleteVehicle: (iri: string) =>
    request<void>(normalizeResourceIri(iri), { method: 'DELETE' }),

  createTrip: (data: { departureTime: string; price: number; route: string; vehicle: string }) =>
    request<{ id?: number; '@id'?: string; departureTime?: string; price?: number; route?: unknown; vehicle?: unknown }>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  findCustomerByPhone: (phone: string) =>
    request<{ id?: number; '@id'?: string; firstName?: string; lastName?: string; phone?: string }>(`/customers/by-phone?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
    }),

  createFreeReservation: (data: { customerId: number | string; tripId: number | string; seatNumber: number }) =>
    request<{ id?: number; customer?: string; trip?: string; seatNumber?: number | null; status?: string }>('/reservations/for-customer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTrip: (iri: string) =>
    request<{ id?: number; departureTime?: string; price?: number; status?: string; route?: string | { departureCity?: { name?: string }; destinationCity?: { name?: string } }; vehicle?: string | { id?: number; seatCapacity?: number | null; brand?: string; licensePlate?: string; driverName?: string } }>(normalizeResourceIri(iri), {
      auth: false,
    }),

  getRoute: (iri: string) =>
    request<{ id?: number; departureCity?: { name?: string }; destinationCity?: { name?: string } }>(normalizeResourceIri(iri), {
      auth: false,
    }),

  getVehicle: (iri: string) =>
    request<{ id?: number; brand?: string; licensePlate?: string; seatCapacity?: number | null; driverName?: string }>(normalizeResourceIri(iri), {
      auth: false,
    }),

  getPartnerTrips: () =>
    request<{ id?: number; departureTime?: string; price?: number; status?: string; availableSeats?: number | null; route?: { departureCity?: { name?: string }; destinationCity?: { name?: string } }; vehicle?: { id?: number; seatCapacity?: number | null; brand?: string; driverName?: string } }[] | { 'hydra:member'?: { id?: number; departureTime?: string; price?: number; status?: string; availableSeats?: number | null; route?: { departureCity?: { name?: string }; destinationCity?: { name?: string } }; vehicle?: { id?: number; seatCapacity?: number | null; brand?: string; driverName?: string } }[] }>('/trips', {
      method: 'GET',
    }),

  startTrip: (iri: string) =>
    request<{ message?: string; status?: string }>(`${normalizeApiPath(iri)}/start`, {
      method: 'PATCH',
    }),

  completeTrip: (iri: string) =>
    request<{ message?: string; status?: string }>(`${normalizeApiPath(iri)}/complete`, {
      method: 'PATCH',
    }),

  cancelTrip: (iri: string) =>
    request<{ message?: string; status?: string }>(`${normalizeApiPath(iri)}/cancel`, {
      method: 'PATCH',
    }),

  getReservations: () =>
    request<{ id?: number; seatNumber?: number | null; status?: string; createdAt?: string; trip?: any; customer?: any }[] | { 'hydra:member'?: { id?: number; seatNumber?: number | null; status?: string; createdAt?: string; trip?: any; customer?: any }[] }>(
      '/reservations',
      {
        method: 'GET',
      },
    ),

  cancelReservation: (iri: string) =>
    request<void>(`${normalizeApiPath(iri)}/cancel`, {
      method: 'POST',
    }),

  createReservation: (data: { trip: string; seatNumber?: number }) =>
    request<{ id?: number; seatNumber?: number | null; status?: string; trip?: any }>(
      '/reservations',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  getCurrentUser: () =>
    request<{ '@id'?: string; id?: number; email?: string; roles?: string[]; accountType?: string; firstName?: string; lastName?: string; companyName?: string; phone?: string; address?: string; description?: string; createdAt?: string }>('/user', {
      method: 'GET',
    }),

  updateCurrentUser: (iri: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(normalizeResourceIri(iri), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    }),

  getDashboardSummary: (accountType: 'customer' | 'partner' | 'admin') =>
    request<Record<string, unknown>>(`/dashboard/${accountType}`),
};