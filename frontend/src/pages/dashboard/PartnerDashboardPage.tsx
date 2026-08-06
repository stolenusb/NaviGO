import { useEffect, useMemo, useState } from 'react';
import { apiClient, type ApiError } from '../../services/api/client';
import { getSessionDisplayName } from '../../services/session';

type Trip = {
  id?: number;
  '@id'?: string;
  departureTime?: string;
  price?: number;
  status?: string;
  availableSeats?: number | null;
  route?: string | RouteDetails | { '@id'?: string; id?: number; departureCity?: { name?: string }; destinationCity?: { name?: string } } | null;
  vehicle?: string | VehicleDetails | { '@id'?: string; id?: number; brand?: string; seatCapacity?: number | null; driverName?: string } | null;
};

type RouteDetails = { departureCity?: { name?: string }; destinationCity?: { name?: string } };
type VehicleDetails = { brand?: string; seatCapacity?: number | null; driverName?: string };

const ACTIVE_STATUSES = new Set(['scheduled', 'in_progress']);

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatStatus = (value?: string) => (value ? value.replaceAll('_', ' ').toUpperCase() : 'UNKNOWN');
const formatPrice = (value?: number) => (typeof value === 'number' ? `${value.toFixed(2)} DH` : 'N/A');
const getTripIri = (trip: Trip) => trip['@id'] ?? (typeof trip.id === 'number' ? `/api/trips/${trip.id}` : undefined);
const toIri = (value?: string | { id?: number; '@id'?: string } | null) => {
  if (typeof value === 'string') return value;
  return value?.['@id'];
};

const toAnyIri = (value?: string | { id?: number; '@id'?: string } | { brand?: string; seatCapacity?: number | null; driverName?: string } | null) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '@id' in value && typeof value['@id'] === 'string') {
    return value['@id'];
  }
  return undefined;
};

const isVehicleDetails = (value: unknown): value is VehicleDetails =>
  typeof value === 'object' && value !== null && ('brand' in value || 'driverName' in value || 'seatCapacity' in value);

const formatCityPair = (departureCity?: { name?: string }, destinationCity?: { name?: string }) => {
  const departure = departureCity?.name ?? 'N/A';
  const destination = destinationCity?.name ?? 'N/A';
  return `${departure} → ${destination}`;
};

export default function PartnerDashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicleMap, setVehicleMap] = useState<Record<string, VehicleDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyTripIds, setBusyTripIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadTrips = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getPartnerTrips();
        const items = Array.isArray(response) ? response : response['hydra:member'] ?? [];

        if (cancelled) return;
        setTrips(items);

        const vehicleIris = Array.from(new Set(items.map((trip) => toAnyIri(trip.vehicle)).filter((value): value is string => Boolean(value))));

        const [vehicles] = await Promise.all([
          Promise.all(vehicleIris.map(async (iri) => [iri, await apiClient.getVehicle(iri)] as const)),
        ]);

        if (cancelled) return;
        setVehicleMap(Object.fromEntries(vehicles));
      } catch (err) {
        const apiError = err as ApiError;
        if (!cancelled) setError(apiError.message || 'Failed to load partner trips.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTrips();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTrips = useMemo(() => trips.filter((trip) => trip.status && ACTIVE_STATUSES.has(trip.status)), [trips]);

  const updateTripStatus = async (trip: Trip, action: 'start' | 'complete' | 'cancel') => {
    const iri = getTripIri(trip);
    const id = trip.id;
    if (!iri || typeof id !== 'number') return;

    setBusyTripIds((current) => [...current, id]);
    setActionMessage(null);

    try {
      if (action === 'start') await apiClient.startTrip(iri);
      if (action === 'complete') await apiClient.completeTrip(iri);
      if (action === 'cancel') await apiClient.cancelTrip(iri);

      const response = await apiClient.getPartnerTrips();
      const items = Array.isArray(response) ? response : response['hydra:member'] ?? [];
      setTrips(items);
      setActionMessage(`Trip ${action === 'start' ? 'started' : action === 'complete' ? 'completed' : 'cancelled'} successfully.`);
    } catch (err) {
      const apiError = err as ApiError;
      setActionMessage(apiError.message || 'Unable to update trip status.');
    } finally {
      setBusyTripIds((current) => current.filter((item) => item !== id));
    }
  };

  const tripDeparture = (trip: Trip) => {
    if (trip.route && typeof trip.route === 'object' && 'departureCity' in trip.route && 'destinationCity' in trip.route) {
      return formatCityPair(trip.route.departureCity, trip.route.destinationCity);
    }

    if (typeof trip.route === 'string') {
      return trip.route;
    }

    return 'N/A → N/A';
  };

  const tripVehicle = (trip: Trip) => {
    const vehicleIri = toAnyIri(trip.vehicle);
    const resolvedVehicle = vehicleIri ? vehicleMap[vehicleIri] : undefined;

    if (resolvedVehicle) {
      return resolvedVehicle;
    }

    if (isVehicleDetails(trip.vehicle)) {
      return trip.vehicle;
    }

    return undefined;
  };

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Partner dashboard</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Operations overview for {getSessionDisplayName()}</h1>
          <p className="mt-2 text-sm text-gray-600">Manage live trips here. Full trip history is available on the history page.</p>
        </section>

        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {actionMessage ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</p> : null}

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-gray-900">Active trips</h2>
              <p className="mt-1 text-sm text-gray-600">Scheduled and in-progress trips you can manage right now.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{activeTrips.length}</span>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-gray-600">Loading active trips...</p> : null}
            {!loading && activeTrips.length === 0 ? <p className="text-sm text-gray-600">No active trips found.</p> : null}

            {activeTrips.map((trip, index) => {
              const id = trip.id ?? trip['@id'] ?? `active-trip-${index}`;
              const isBusy = typeof trip.id === 'number' && busyTripIds.includes(trip.id);
              const isScheduled = trip.status === 'scheduled';
              const isInProgress = trip.status === 'in_progress';
              const vehicle = tripVehicle(trip);

              return (
                <article key={`active-${id}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tripDeparture(trip)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-emerald-700">{formatStatus(trip.status)}</p>
                      </div>

                      <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-3">
                        <p><span className="font-medium text-gray-900">Departure:</span> {formatDateTime(trip.departureTime)}</p>
                        <p><span className="font-medium text-gray-900">Price:</span> {formatPrice(trip.price)}</p>
                        <p><span className="font-medium text-gray-900">Seats left:</span> {trip.availableSeats ?? vehicle?.seatCapacity ?? 'N/A'}</p>
                        <p><span className="font-medium text-gray-900">Vehicle:</span> {isVehicleDetails(vehicle) ? vehicle.brand ?? 'N/A' : 'N/A'}</p>
                        <p><span className="font-medium text-gray-900">Driver:</span> {isVehicleDetails(vehicle) ? vehicle.driverName ?? 'N/A' : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-40">
                      {isScheduled ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void updateTripStatus(trip, 'start')}
                            disabled={isBusy}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? 'Updating...' : 'Start trip'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateTripStatus(trip, 'cancel')}
                            disabled={isBusy}
                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? 'Updating...' : 'Cancel trip'}
                          </button>
                        </div>
                      ) : null}

                      {isInProgress ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void updateTripStatus(trip, 'complete')}
                            disabled={isBusy}
                            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? 'Updating...' : 'Complete trip'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateTripStatus(trip, 'cancel')}
                            disabled={isBusy}
                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? 'Updating...' : 'Cancel trip'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}