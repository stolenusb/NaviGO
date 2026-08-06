import { useEffect, useMemo, useState } from 'react';
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
  route?: { departureCity?: { name?: string }; destinationCity?: { name?: string } } | string | null;
  vehicle?: { brand?: string; seatCapacity?: number | null; driverName?: string } | string | null;
};

export default function PartnerHistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTripIds, setBusyTripIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadTrips = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getPartnerTrips();
        const items = Array.isArray(response) ? response : response['hydra:member'] ?? [];
        if (!cancelled) setTrips(items);
      } catch (err) {
        const apiError = err as ApiError;
        if (!cancelled) setError(apiError.message || 'Failed to load partner trip history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTrips();

    return () => {
      cancelled = true;
    };
  }, []);

  const historyTrips = useMemo(() => trips, [trips]);

  const refreshTrips = async () => {
    const response = await apiClient.getPartnerTrips();
    return Array.isArray(response) ? response : response['hydra:member'] ?? [];
  };

  const updateTripStatus = async (trip: Trip, action: 'start' | 'complete' | 'cancel') => {
    const iri = trip['@id'] ?? (typeof trip.id === 'number' ? `/api/trips/${trip.id}` : undefined);
    const id = trip.id;
    if (!iri || typeof id !== 'number') return;

    setBusyTripIds((current) => [...current, id]);

    try {
      if (action === 'start') await apiClient.startTrip(iri);
      if (action === 'complete') await apiClient.completeTrip(iri);
      if (action === 'cancel') await apiClient.cancelTrip(iri);

      setTrips(await refreshTrips());
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Unable to update trip status.');
    } finally {
      setBusyTripIds((current) => current.filter((item) => item !== id));
    }
  };

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Partner history</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Trip history for {getSessionDisplayName()}</h1>
          <p className="mt-2 text-sm text-gray-600">Review all completed, cancelled, and archived partner trips.</p>
        </section>

        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <TripHistoryList
            trips={historyTrips}
            loading={loading}
            emptyMessage="No trip history available yet."
            showActions
            busyTripIds={busyTripIds}
            onStart={(trip) => updateTripStatus(trip, 'start')}
            onComplete={(trip) => updateTripStatus(trip, 'complete')}
            onCancel={(trip) => updateTripStatus(trip, 'cancel')}
          />
        </section>
      </div>
    </main>
  );
}