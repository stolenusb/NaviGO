import { useMemo, useState } from 'react';

type Trip = {
  id?: number;
  '@id'?: string;
  departureTime?: string;
  price?: number;
  status?: string;
  availableSeats?: number | null;
  route?: { departureCity?: { name?: string }; destinationCity?: { name?: string } } | string | null;
  vehicle?: { brand?: string; name?: string; seatCapacity?: number | null; driverName?: string } | string | null;
};

type Props = {
  trips: Trip[];
  loading?: boolean;
  emptyMessage: string;
  showActions?: boolean;
  onStart?: (trip: Trip) => Promise<void> | void;
  onComplete?: (trip: Trip) => Promise<void> | void;
  onCancel?: (trip: Trip) => Promise<void> | void;
  busyTripIds?: number[];
};

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatStatus = (value?: string) => (value ? value.replaceAll('_', ' ').toUpperCase() : 'UNKNOWN');
const formatPrice = (value?: number) => (typeof value === 'number' ? `${value.toFixed(2)} DH` : 'N/A');

const getStatusStyles = (value?: string) => {
  switch (value) {
    case 'scheduled':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 ring-red-200';
    default:
      return 'bg-gray-100 text-gray-700 ring-gray-200';
  }
};

const getVehicleLabel = (trip: Trip) => {
  if (trip.vehicle && typeof trip.vehicle === 'object') {
    return trip.vehicle.name ?? trip.vehicle.brand ?? 'N/A';
  }

  return typeof trip.vehicle === 'string' ? trip.vehicle : 'N/A';
};

const getDriverLabel = (trip: Trip) => {
  if (trip.vehicle && typeof trip.vehicle === 'object') {
    return trip.vehicle.driverName ?? 'N/A';
  }

  return 'N/A';
};

const formatTripTitle = (trip: Trip) => {
  const departure = trip.route && typeof trip.route === 'object' ? trip.route.departureCity?.name : undefined;
  const arrival = trip.route && typeof trip.route === 'object' ? trip.route.destinationCity?.name : undefined;
  return `${departure ?? 'N/A'} → ${arrival ?? 'N/A'}`;
};

export default function TripHistoryList({
  trips,
  loading = false,
  emptyMessage,
  showActions = false,
  onStart,
  onComplete,
  onCancel,
  busyTripIds = [],
}: Props) {
  const canShowActions = showActions && (onStart || onComplete || onCancel);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const visibleTrips = useMemo(() => trips, [trips]);

  const isExpanded = (trip: Trip, index: number) => {
    if (typeof trip.id === 'number') return expandedIds.includes(trip.id);
    return index === 0;
  };

  const toggleTrip = (trip: Trip) => {
    if (typeof trip.id !== 'number') return;
    setExpandedIds((current) => (current.includes(trip.id!) ? current.filter((id) => id !== trip.id) : [...current, trip.id!]));
  };

  return (
    <div className="mt-4 space-y-3">
      {loading ? <p className="text-sm text-gray-600">Loading trip history...</p> : null}
      {!loading && visibleTrips.length === 0 ? <p className="text-sm text-gray-600">{emptyMessage}</p> : null}

      {visibleTrips.map((trip, index) => {
        const id = trip.id ?? trip['@id'] ?? `history-trip-${index}`;
        const isBusy = typeof trip.id === 'number' && busyTripIds.includes(trip.id);
        const isScheduled = trip.status === 'scheduled';
        const isInProgress = trip.status === 'in_progress';
        const expanded = isExpanded(trip, index);

        return (
          <article key={`history-${id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
            <button
              type="button"
              onClick={() => toggleTrip(trip)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
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
                    <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">{formatTripTitle(trip)}</h3>
                    <p className="text-sm text-gray-600">{formatDateTime(trip.departureTime)}</p>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-[17px] font-semibold leading-tight text-gray-900 sm:text-lg">{formatPrice(trip.price)}</span>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ${getStatusStyles(trip.status)}`}>
                      {formatStatus(trip.status)}
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
                        <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Vehicle</span>
                        <span className="mt-1 block font-medium text-gray-900">{getVehicleLabel(trip)}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Driver</span>
                        <span className="mt-1 block font-medium text-gray-900">{getDriverLabel(trip)}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Time</span>
                        <span className="mt-1 block font-medium text-gray-900">{formatDateTime(trip.departureTime)}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Seat</span>
                        <span className="mt-1 block font-medium text-gray-900">{trip.availableSeats ?? 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Code</span>
                        <span className="mt-1 block font-medium text-gray-900">#{typeof trip.id === 'number' ? trip.id : index + 1}</span>
                      </div>
                    </div>

                    {canShowActions ? (
                      <div className="flex flex-col items-end justify-start gap-2 lg:pt-1">
                        {isScheduled && onStart ? (
                          <button type="button" onClick={() => void onStart(trip)} disabled={isBusy} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {isBusy ? 'Updating...' : 'Start trip'}
                          </button>
                        ) : null}
                        {isInProgress && onComplete ? (
                          <button type="button" onClick={() => void onComplete(trip)} disabled={isBusy} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {isBusy ? 'Updating...' : 'Complete trip'}
                          </button>
                        ) : null}
                        {(isScheduled || isInProgress) && onCancel ? (
                          <button type="button" onClick={() => void onCancel(trip)} disabled={isBusy} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {isBusy ? 'Updating...' : 'Cancel trip'}
                          </button>
                        ) : null}
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
  );
}
