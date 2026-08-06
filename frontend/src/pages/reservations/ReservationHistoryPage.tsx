import { useEffect, useState } from 'react';
import ReservationList, { type Reservation } from '../../components/reservations/ReservationList';
import { apiClient } from '../../services/api/client';
import type { ApiError } from '../../services/api/client';

export default function ReservationHistoryPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

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

          <ReservationList
            reservations={reservations}
            loading={loading}
            emptyMessage="You have no reservations yet."
            unauthorizedMessage={unauthorized ? 'Your session expired. Please log in again to view your reservation history.' : undefined}
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
        </section>
      </div>
    </main>
  );
}