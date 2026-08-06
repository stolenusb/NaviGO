import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReservationList, { type Reservation } from '../../components/reservations/ReservationList';
import { apiClient } from '../../services/api/client';
import { getSessionDisplayName } from '../../services/session';
import type { ApiError } from '../../services/api/client';

export default function CustomerDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
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

          <ReservationList
            reservations={reservations}
            loading={loading}
            emptyMessage="You have no reservations yet."
            unauthorizedMessage={unauthorized ? 'Your session expired. Please log in again to view your reservations and dashboard data.' : undefined}
            limit={3}
            showActions
            onCancel={async (reservation) => {
              const iri = reservation['@id'] ?? (typeof reservation.id === 'number' ? `/api/reservations/${reservation.id}` : undefined);
              if (!iri || typeof reservation.id !== 'number') return;

              await apiClient.cancelReservation(iri);
              setReservations((current) =>
                current.map((item) =>
                  item.id === reservation.id ? { ...item, status: 'cancelled', seatNumber: null } : item,
                ),
              );
            }}
          />

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