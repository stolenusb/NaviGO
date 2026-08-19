import { useMemo, useState } from 'react';

export type Reservation = {
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

type Props = {
  reservations: Reservation[];
  onCancel?: (reservation: Reservation) => Promise<void> | void;
  emptyMessage: string;
  loading?: boolean;
  unauthorizedMessage?: string;
  showActions?: boolean;
  limit?: number;
  onReservationCountChange?: (count: number) => void;
};

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatPrice = (value?: number) => (typeof value === 'number' ? `${value.toFixed(2)} DH` : 'N/A');

const formatStatus = (value?: string) => (value ? value.replaceAll('_', ' ').toUpperCase() : 'UNKNOWN');

const getStatusStyles = (value?: string) => {
  switch (value) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 ring-red-200';
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'completed':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 ring-gray-200';
  }
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

const formatTripTitle = (reservation: Reservation) => {
  const departure = reservation.trip?.route?.departureCity?.name;
  const arrival = reservation.trip?.route?.destinationCity?.name;
  return `${departure ?? 'N/A'} → ${arrival ?? 'N/A'}`;
};

export default function ReservationList({
  reservations,
  onCancel,
  emptyMessage,
  loading = false,
  unauthorizedMessage,
  showActions = false,
  limit,
  onReservationCountChange,
}: Props) {
  const [expandedReservationIds, setExpandedReservationIds] = useState<number[]>([]);
  const [cancellingIds, setCancellingIds] = useState<number[]>([]);
  const visibleReservations = useMemo(() => (typeof limit === 'number' ? reservations.slice(0, limit) : reservations), [limit, reservations]);

  const getReservationIri = (reservation: Reservation) => {
    if (reservation['@id']) return reservation['@id'];
    if (typeof reservation.id === 'number') return `/api/reservations/${reservation.id}`;
    return undefined;
  };

  const canCancelReservation = (reservation: Reservation) =>
    reservation.status === 'confirmed' && reservation.trip?.status === 'scheduled';

  const isExpanded = (reservation: Reservation, index: number) => {
    const id = reservation.id;
    if (typeof id === 'number') return expandedReservationIds.includes(id);
    return index === 0;
  };

  const toggleReservation = (reservation: Reservation) => {
    const id = reservation.id;
    if (typeof id !== 'number') return;

    setExpandedReservationIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleCancel = async (reservation: Reservation) => {
    const id = reservation.id;
    const iri = getReservationIri(reservation);
    if (!iri || typeof id !== 'number' || !onCancel) return;

    setCancellingIds((current) => [...current, id]);

    try {
      await onCancel(reservation);
    } finally {
      setCancellingIds((current) => current.filter((itemId) => itemId !== id));
    }
  };

  if (onReservationCountChange) {
    onReservationCountChange(visibleReservations.length);
  }

  return (
    <>
      {unauthorizedMessage ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {unauthorizedMessage}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {loading ? <p className="text-sm text-gray-600">Loading reservations...</p> : null}
        {!loading && visibleReservations.length === 0 ? <p className="text-sm text-gray-600">{emptyMessage}</p> : null}

        {visibleReservations.map((reservation, index) => {
          const isBusy = typeof reservation.id === 'number' && cancellingIds.includes(reservation.id);
          const expanded = isExpanded(reservation, index);
          const canCancel = showActions && onCancel && canCancelReservation(reservation);

          return (
            <article
              key={getStableListKey(reservation, index)}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => toggleReservation(reservation)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
                aria-expanded={expanded}
              >
                <span
                  className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">
                        {formatTripTitle(reservation)}
                      </h3>
                      <p className="text-sm text-gray-600">{formatDateTime(reservation.trip?.departureTime)}</p>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <span className="text-[17px] font-semibold leading-tight text-gray-900 sm:text-lg">
                        {formatPrice(reservation.trip?.price)}
                      </span>
                      <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ${getStatusStyles(reservation.status)}`}>
                        {formatStatus(reservation.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="min-h-0 overflow-hidden border-t border-gray-100 bg-gray-50 px-5">
                  <div className="py-4 text-sm text-gray-600">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Trip status</span>
                          <span className="mt-1 block font-medium text-gray-900">{formatStatus(reservation.trip?.status)}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Seat</span>
                          <span className="mt-1 block font-medium text-gray-900">{reservation.seatNumber ?? 'Auto-assigned'}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Code</span>
                          <span className="mt-1 block font-medium text-gray-900">#{getReservationNumber(reservation, index)}</span>
                        </div>
                      </div>

                      {canCancel ? (
                        <div className="flex flex-col items-end justify-start gap-2 lg:pt-1">
                          <button
                            type="button"
                            onClick={() => void handleCancel(reservation)}
                            disabled={isBusy}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? 'Cancelling...' : 'Cancel reservation'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}