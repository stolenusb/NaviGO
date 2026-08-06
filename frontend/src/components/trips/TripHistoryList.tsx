type Trip = {
  id?: number;
  '@id'?: string;
  departureTime?: string;
  price?: number;
  status?: string;
  availableSeats?: number | null;
  route?: { departureCity?: { name?: string }; destinationCity?: { name?: string } } | string | null;
  vehicle?: { brand?: string; seatCapacity?: number | null; driverName?: string } | string | null;
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

const getTripTitle = (trip: Trip) => {
  const departure = trip.route && typeof trip.route === 'object' ? trip.route.departureCity?.name : undefined;
  const arrival = trip.route && typeof trip.route === 'object' ? trip.route.destinationCity?.name : undefined;
  const from = departure ?? 'N/A';
  const to = arrival ?? 'N/A';
  return `${from} → ${to}`;
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

  return (
    <div className="mt-4 space-y-3">
      {loading ? <p className="text-sm text-gray-600">Loading trip history...</p> : null}
      {!loading && trips.length === 0 ? <p className="text-sm text-gray-600">{emptyMessage}</p> : null}

      {trips.map((trip, index) => {
        const id = trip.id ?? trip['@id'] ?? `history-trip-${index}`;
        const isBusy = typeof trip.id === 'number' && busyTripIds.includes(trip.id);
        const isScheduled = trip.status === 'scheduled';
        const isInProgress = trip.status === 'in_progress';

        return (
          <article key={`history-${id}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{getTripTitle(trip)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-600">{formatStatus(trip.status)}</p>
              </div>
              <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-3">
                <p><span className="font-medium text-gray-900">Departure:</span> {formatDateTime(trip.departureTime)}</p>
                <p><span className="font-medium text-gray-900">Price:</span> {formatPrice(trip.price)}</p>
                <p><span className="font-medium text-gray-900">Seats left:</span> {trip.availableSeats ?? 'N/A'}</p>
                <p><span className="font-medium text-gray-900">Vehicle:</span> {typeof trip.vehicle === 'object' ? trip.vehicle?.brand ?? 'N/A' : 'N/A'}</p>
                <p><span className="font-medium text-gray-900">Driver:</span> {typeof trip.vehicle === 'object' ? trip.vehicle?.driverName ?? 'N/A' : 'N/A'}</p>
                <p><span className="font-medium text-gray-900">Route:</span> {trip.route && typeof trip.route === 'object' ? `${trip.route.departureCity?.name ?? 'N/A'} → ${trip.route.destinationCity?.name ?? 'N/A'}` : 'N/A'}</p>
              </div>

              {canShowActions ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {isScheduled && onStart ? (
                    <button
                      type="button"
                      onClick={() => void onStart(trip)}
                      disabled={isBusy}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? 'Updating...' : 'Start trip'}
                    </button>
                  ) : null}
                  {isInProgress && onComplete ? (
                    <button
                      type="button"
                      onClick={() => void onComplete(trip)}
                      disabled={isBusy}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? 'Updating...' : 'Complete trip'}
                    </button>
                  ) : null}
                  {(isScheduled || isInProgress) && onCancel ? (
                    <button
                      type="button"
                      onClick={() => void onCancel(trip)}
                      disabled={isBusy}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? 'Updating...' : 'Cancel trip'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}