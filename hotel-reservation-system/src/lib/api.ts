import { getToken } from './auth';

type ApiError = {
  error: string;
};

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => null)) as T | ApiError | null;

  if (!res.ok) {
    const message = (data as any)?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function register(params: { email: string; password: string; name?: string }) {
  return request<{ token: string; user: { id: string; email: string; name: string | null; role: string } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
  );
}

export async function login(params: { email: string; password: string }) {
  return request<{ token: string; user: { id: string; email: string; name: string | null; role: string } }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
  );
}

export type AvailableRoom = {
  id: string;
  number: string;
  floor: number | null;
  roomType: {
    id: string;
    name: string;
    capacity: number;
    basePrice: string | number;
  };
};

export async function getAvailableRooms(params: { hotelId: string; from: string; to: string }) {
  const qs = new URLSearchParams({
    hotelId: params.hotelId,
    from: params.from,
    to: params.to,
  });

  return request<{ hotelId: string; from: string; to: string; rooms: AvailableRoom[] }>(
    `/api/rooms/available?${qs.toString()}`,
  );
}

export async function createReservation(params: {
  roomId: string;
  startDate: string;
  endDate: string;
}) {
  const token = getToken();
  if (!token) throw new Error('Unauthorized');

  return request<{ reservation: any }>('/api/reservations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
}

export type MeUser = { id: string; email: string; name: string | null };

export async function getMe() {
  const token = getToken();
  if (!token) throw new Error('Unauthorized');

  return request<{ user: MeUser }>('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export type HotelListItem = { id: string; name: string; address: string };

export async function getHotels() {
  return request<{ hotels: HotelListItem[] }>('/api/hotels');
}
