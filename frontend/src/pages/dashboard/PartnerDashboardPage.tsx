import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, type ApiError } from '../../services/api/client';
import { getSessionDisplayName } from '../../services/session';
import TripHistoryList from '../../components/trips/TripHistoryList';

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

const getTripIri = (trip: Trip) => trip['@id'] ?? (typeof trip.id === 'number' ? `/api/trips/${trip.id}` : undefined);

export default function PartnerDashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
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
        if (cancelled) return;
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

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Partner dashboard</p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">Operations overview for {getSessionDisplayName()}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Manage live trips, monitor availability, and keep your transport operations moving.</p>
            </div>
            <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Partner</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard/settings" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-blue-50">Account settings</Link>
            <Link to="/dashboard/partner/history" className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">Trip history</Link>
          </div>
        </section>

        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {actionMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</p> : null}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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

            <TripHistoryList
              trips={activeTrips}
              loading={loading}
              emptyMessage="No active trips found."
              showActions
              busyTripIds={busyTripIds}
              onStart={(trip) => updateTripStatus(trip, 'start')}
              onComplete={(trip) => updateTripStatus(trip, 'complete')}
              onCancel={(trip) => updateTripStatus(trip, 'cancel')}
            />
          </div>
        </section>
      </div>
    </main>
  );
}