import { useEffect, useState } from 'react';
import { apiClient } from '../../services/api/client';
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

export default function ReservationHistoryPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingIds, setCancellingIds] = useState<number[]>([]);
  const [expandedReservationIds, setExpandedReservationIds] = useState<number[]>([]);
  const [unauthorized, setUnauthorized] = useState(false);

  const panelTransitionClass = 'grid transition-all duration-300 ease-in-out';

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatDepartureTime = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const formatPrice = (value?: number) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(2)} DH`;
  };

  const formatStatus = (value?: string) => (value ? value.toUpperCase() : 'UNKNOWN');

  const normalizeReservations = (data: unknown): Reservation[] => {
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
      const collection = data as {
        member?: Reservation[];
        'hydra:member'?: Reservation[];
      };
      if (Array.isArray(collection.member)) return collection.member;
      if (Array.isArray(collection['hydra:member'])) return collection['hydra:member'];
    }

    return [];
  };

  const getReservationNumber = (reservation: Reservation, index?: number) => {
    if (typeof reservation.id === 'number') return reservation.id;
    const iri = reservation['@id'];
    if (iri) return iri.split('/').pop() ?? 'N/A';
    return typeof index === 'number' ? index + 1 : 'Pending sync';
  };

  const getStableListKey = (reservation: Reservation, index: number) => {
    const idPart = typeof reservation.id === 'number' ? reservation.id : reservation['@id'] ?? 'unknown';
    return `reservation-${index}-${idPart}`;
  };

  const canCancelReservation = (reservation: Reservation) =>
    reservation.status === 'confirmed' && reservation.trip?.status === 'scheduled';

  const getReservationIri = (reservation: Reservation) => {
    if (reservation['@id']) return reservation['@id'];
    if (typeof reservation.id === 'number') return `/api/reservations/${reservation.id}`;
    return undefined;
  };

  const handleCancel = async (reservation: Reservation) => {
    const iri = getReservationIri(reservation);
    if (!iri) return;

    const reservationKey = Number(getReservationNumber(reservation));
    setCancellingIds((current) => [...current, reservationKey]);

    try {
      await apiClient.cancelReservation(iri);
      setReservations((current) =>
        current.map((item) => {
          if (getReservationNumber(item) !== getReservationNumber(reservation)) {
            return item;
          }

          return {
            ...item,
            status: 'cancelled',
            seatNumber: null,
          };
        }),
      );
    } catch {
      // Keep the UI stable; the backend will decide whether the cancellation is allowed.
    } finally {
      setCancellingIds((current) => current.filter((id) => id !== reservationKey));
    }
  };

  const getReservationId = (reservation: Reservation) => reservation.id ?? null;

  const isExpanded = (reservation: Reservation) => {
    const id = getReservationId(reservation);
    return typeof id === 'number' && expandedReservationIds.includes(id);
  };

  const toggleReservation = (reservation: Reservation) => {
    const id = getReservationId(reservation);
    if (typeof id !== 'number') return;

    setExpandedReservationIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.getReservations();
        setReservations(normalizeReservations(data));
      } catch (error) {
        const apiError = error as ApiError;
        if (apiError.status === 401) {
          setUnauthorized(true);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-gray-200 bg-white px-6 py-5 shadow-sm sm:px-8 sm:py-6">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Reservations</p>
          <h1 className="mt-3 text-[28px] font-normal tracking-[-0.03em] text-gray-900 sm:text-[32px]">History</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">
            Review past trips, seat assignments, and reservation status in one place.
          </p>

          {unauthorized ? (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your session expired. Please log in again to view your reservation history.
            </p>
          ) : null}

          {loading ? <p className="mt-6 text-sm text-gray-600">Loading reservations...</p> : null}

          {!loading && reservations.length === 0 ? (
            <p className="mt-6 text-sm text-gray-600">You have no reservations yet.</p>
          ) : null}

          <div className="mt-5 space-y-3">
            {reservations.map((reservation, index) => (
              <article
                key={getStableListKey(reservation, index)}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleReservation(reservation)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5"
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform duration-300 ${
                      isExpanded(reservation) ? 'rotate-180' : 'rotate-0'
                    }`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">
                          {formatDate(reservation.trip?.departureTime)}
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

                <div className={`${panelTransitionClass} ${isExpanded(reservation) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="min-h-0 overflow-hidden border-t border-gray-100 bg-gray-50 px-5">
                    <div className="py-4">
                      <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Departure</span>
                          <span className="mt-1 block font-medium text-gray-900">{reservation.trip?.route?.departureCity?.name ?? 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Arrival</span>
                          <span className="mt-1 block font-medium text-gray-900">{reservation.trip?.route?.destinationCity?.name ?? 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Time</span>
                          <span className="mt-1 block font-medium text-gray-900">{formatDepartureTime(reservation.trip?.departureTime)}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Seat</span>
                          <span className="mt-1 block font-medium text-gray-900">{reservation.seatNumber ?? 'Auto-assigned'}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Trip status</span>
                          <span className="mt-1 block font-medium text-gray-900">{formatStatus(reservation.trip?.status)}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Code</span>
                          <span className="mt-1 block font-medium text-gray-900">#{getReservationNumber(reservation, index)}</span>
                        </div>
                      </div>

                      {canCancelReservation(reservation) ? (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleCancel(reservation)}
                            disabled={cancellingIds.includes(Number(getReservationNumber(reservation)))}
                            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                          {cancellingIds.includes(Number(getReservationNumber(reservation))) ? 'Cancelling...' : 'Cancel reservation'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}