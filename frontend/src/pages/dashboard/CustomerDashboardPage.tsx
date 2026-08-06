import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/api/client';
import { getSessionDisplayName } from '../../services/session';
import type { ApiError } from '../../services/api/client';

type Reservation = {
  id?: number;
  status?: string;
  seatNumber?: number | null;
  createdAt?: string;
  '@id'?: string;
  trip?: {
    id?: number;
    departureTime?: string;
    price?: number;
    status?: string;
    route?: {
      departureCity?: { name?: string };
      destinationCity?: { name?: string };
    };
  };
};

const formatShortDate = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatPrice = (value?: number) => {
  if (typeof value !== 'number') {
    return 'N/A';
  }

  return `${value.toFixed(2)} DH`;
};

const formatStatus = (value?: string) => (value ? value.toUpperCase() : 'UNKNOWN');

export default function CustomerDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [expandedReservationIds, setExpandedReservationIds] = useState<number[]>([]);
  const [cancellingIds, setCancellingIds] = useState<number[]>([]);

  const resolveTrip = async (reservation: Reservation): Promise<Reservation> => {
    const tripRef = typeof reservation.trip === 'string' ? reservation.trip : (reservation.trip as unknown as { '@id'?: string })?.['@id'];

    if (!tripRef || typeof tripRef !== 'string') {
      return reservation;
    }

    try {
      const trip = await apiClient.getTrip(tripRef);
      return { ...reservation, trip: { ...(reservation.trip as object), ...trip } as Reservation['trip'] };
    } catch {
      return reservation;
    }
  };

  const normalizeReservations = (data: unknown): Reservation[] => {
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === 'object') {
      const collection = data as { member?: Reservation[]; 'hydra:member'?: Reservation[] };
      if (Array.isArray(collection.member)) {
        return collection.member;
      }

      if (Array.isArray(collection['hydra:member'])) {
        return collection['hydra:member'];
      }
    }

    return [];
  };

  const getReservationId = (reservation: Reservation) => reservation.id ?? null;

  const isExpanded = (reservation: Reservation, index: number) => {
    const id = getReservationId(reservation);
    if (typeof id === 'number') {
      return expandedReservationIds.includes(id);
    }

    return index === 0;
  };

  const toggleReservation = (reservation: Reservation) => {
    const id = getReservationId(reservation);
    if (typeof id !== 'number') return;

    setExpandedReservationIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const canCancelReservation = (reservation: Reservation) =>
    reservation.status === 'confirmed' && reservation.trip?.status === 'scheduled';

  const handleCancel = async (reservation: Reservation) => {
    const id = reservation.id;
    const iri = reservation['@id'] ?? (typeof id === 'number' ? `/api/reservations/${id}` : undefined);
    if (!iri || typeof id !== 'number') return;

    setCancellingIds((current) => [...current, id]);

    try {
      await apiClient.cancelReservation(iri);
      setReservations((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'cancelled',
                seatNumber: null,
              }
            : item,
        ),
      );
    } finally {
      setCancellingIds((current) => current.filter((itemId) => itemId !== id));
    }
  };

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const data = await apiClient.getReservations();
        const items = normalizeReservations(data);
        setReservations(await Promise.all(items.map((reservation) => resolveTrip(reservation))));
      } catch (error) {
        const apiError = error as ApiError;
        if (apiError.status === 401) {
          setUnauthorized(true);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadReservations();
  }, []);

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Customer dashboard</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Welcome back, {getSessionDisplayName()}</h1>
          {unauthorized ? (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your session expired. Please log in again to view your reservations and dashboard data.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Search trips</Link>
            <Link to="/dashboard/customer/settings" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Account Settings</Link>
            <Link to="/dashboard/customer/history" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Reservations History</Link>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Reservations</p>
              <h2 className="mt-2 text-xl font-normal text-black">Your latest bookings</h2>
            </div>
          </div>

          {loading ? <p className="mt-4 text-sm text-gray-600">Loading reservations...</p> : null}

          {!loading && reservations.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">You have no reservations yet.</p>
          ) : null}

          <div className="mt-5 space-y-3">
            {reservations.slice(0, 3).map((reservation, index) => (
              <article
                key={reservation.id ?? reservation['@id'] ?? index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleReservation(reservation)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5"
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform duration-300 ${
                      isExpanded(reservation, index) ? 'rotate-180' : 'rotate-0'
                    }`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">
                          {formatShortDate(reservation.trip?.departureTime)}
                        </h3>
                        <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-700">
                          {formatStatus(reservation.status)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-right">
                        <span className="text-[17px] font-semibold leading-tight text-gray-900 sm:text-lg">
                          {formatPrice(reservation.trip?.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded(reservation, index) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="min-h-0 overflow-hidden border-t border-gray-100 bg-gray-50 px-5">
                    <div className="py-4 text-sm text-gray-600">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Departure</span>
                          <span className="mt-1 block font-medium text-gray-900">
                            {reservation.trip?.route?.departureCity?.name ?? 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Arrival</span>
                          <span className="mt-1 block font-medium text-gray-900">
                            {reservation.trip?.route?.destinationCity?.name ?? 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Time</span>
                          <span className="mt-1 block font-medium text-gray-900">{formatShortDate(reservation.trip?.departureTime)}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Trip status</span>
                          <span className="mt-1 block font-medium text-gray-900">{formatStatus(reservation.trip?.status)}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Seat</span>
                          <span className="mt-1 block font-medium text-gray-900">{reservation.seatNumber ?? 'Auto-assigned'}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Code</span>
                          <span className="mt-1 block font-medium text-gray-900">#{reservation.id ?? index + 1}</span>
                        </div>
                      </div>

                      {canCancelReservation(reservation) ? (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleCancel(reservation)}
                            disabled={reservation.id ? cancellingIds.includes(reservation.id) : false}
                            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {reservation.id && cancellingIds.includes(reservation.id) ? 'Cancelling...' : 'Cancel reservation'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {reservations.length > 3 ? null : null}
          </div>

          <div className="mt-4 flex justify-end">
            <Link to="/dashboard/customer/history" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Show more
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}