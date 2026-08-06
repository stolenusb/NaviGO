import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../services/api/client';

type Trip = {
  id?: number;
  availableSeats?: number | null;
  status?: string;
  '@id'?: string;
  departureTime?: string;
  price?: number;
  vehicle?: { seatCapacity?: number | null } | string | null;
};

type Reservation = {
  id?: number;
  trip?: { id?: number } | string;
  seatNumber?: number | null;
  status?: string;
};

const BUS_SEAT_ROWS = 11;
const STAIRS_ROW_INDICES = new Set([0, Math.floor(BUS_SEAT_ROWS / 2)]);

const StairsIcon = ({ className = '' }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M4 20h4v-4h4v-4h4v-4h4" />
  </svg>
);

type SeatSelectionModalProps = {
  tripId: string | number;
  onClose: () => void;
  onBooked?: () => void;
};

export function SeatSelectionModal({ tripId, onClose, onBooked }: SeatSelectionModalProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [vehicleSeatCapacity, setVehicleSeatCapacity] = useState<number | null>(null);
  const [reservedSeats, setReservedSeats] = useState<number[]>([]);
  const [seatNumber, setSeatNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tripLoading, setTripLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const tripIri = useMemo(() => `/api/trips/${tripId}`, [tripId]);
  const seatCapacity = vehicleSeatCapacity ?? (trip?.availableSeats ?? null);

  const availableSeats = useMemo(() => {
    if (typeof seatCapacity !== 'number' || seatCapacity < 1) return [];
    return Array.from({ length: seatCapacity }, (_, index) => index + 1);
  }, [seatCapacity]);

  const seatRows = useMemo(() => {
    const rows: Array<{ left: number[]; right: number[]; isStairsRow: boolean }> = [];
    let cursor = 0;

    for (let rowIndex = 0; rowIndex < BUS_SEAT_ROWS && cursor < availableSeats.length; rowIndex += 1) {
      const isStairsRow = STAIRS_ROW_INDICES.has(rowIndex);
      const left: number[] = [];
      const right: number[] = [];
      const rightSlots = isStairsRow ? 0 : 2;

      for (let i = 0; i < 2 && cursor < availableSeats.length; i += 1) {
        left.push(availableSeats[cursor]);
        cursor += 1;
      }
      for (let i = 0; i < rightSlots && cursor < availableSeats.length; i += 1) {
        right.push(availableSeats[cursor]);
        cursor += 1;
      }

      rows.push({ left, right, isStairsRow });
    }

    return rows;
  }, [availableSeats]);

  // Animate out, then actually call onClose after the animation finishes
  const handleClose = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 160);
  };

  // Lock background scroll while the modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadTrip = async () => {
      setTripLoading(true);
      try {
        const data = await apiClient.getTrip(tripIri);
        setTrip(data);
        setVehicleSeatCapacity(null);

        if (typeof data.vehicle === 'string') {
          try {
            const vehicle = await apiClient.getVehicle(data.vehicle);
            setVehicleSeatCapacity(vehicle.seatCapacity ?? null);
          } catch {
            setVehicleSeatCapacity(null);
          }
        } else if (data.vehicle && typeof data.vehicle === 'object') {
          setVehicleSeatCapacity(data.vehicle.seatCapacity ?? null);
        }

        try {
          const reservationsResponse = await apiClient.getReservations();
          const reservations = Array.isArray(reservationsResponse)
            ? reservationsResponse
            : (reservationsResponse as { member?: Reservation[]; 'hydra:member'?: Reservation[] }).member ??
              (reservationsResponse as { member?: Reservation[]; 'hydra:member'?: Reservation[] })['hydra:member'] ??
              [];

          const tripIdValue = data.id ?? Number.parseInt(String(tripId), 10);
          const occupied = reservations
            .filter((reservation) => {
              if (reservation.status === 'cancelled') return false;
              if (typeof reservation.trip === 'string') {
                return reservation.trip.endsWith(`/api/trips/${tripIdValue}`);
              }
              return reservation.trip?.id === tripIdValue;
            })
            .map((reservation) => reservation.seatNumber)
            .filter((seat): seat is number => typeof seat === 'number');

          setReservedSeats(Array.from(new Set(occupied)).sort((a, b) => a - b));
        } catch {
          setReservedSeats([]);
        }
      } catch {
        setTrip(null);
        setVehicleSeatCapacity(null);
        setReservedSeats([]);
      } finally {
        setTripLoading(false);
      }
    };

    void loadTrip();
  }, [tripIri, tripId]);

  const handleReserve = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (seatNumber === null) {
      setError('Please select a seat before confirming.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.createReservation({ trip: tripIri, seatNumber });
      if (onBooked) {
        onBooked();
      } else {
        handleClose();
      }
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to create reservation.');
    } finally {
      setLoading(false);
    }
  };

  const seatButtonClass = (seat: number) =>
    `flex aspect-square h-7.5 w-[30px] shrink-0 items-center justify-center rounded-lg border p-0 text-[9px] font-semibold leading-none transition sm:h-8 sm:w-8 sm:text-[10px] ${
      reservedSeats.includes(seat)
        ? 'cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400'
        : seatNumber === seat
          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
    }`;

  const Seat = ({ seat }: { seat: number }) => (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!reservedSeats.includes(seat)) setSeatNumber(seat);
      }}
      disabled={reservedSeats.includes(seat)}
      className={seatButtonClass(seat)}
      style={{ padding: 0, lineHeight: 1 }}
    >
      {seat}
    </button>
  );

  return (
    <>
      {/* Real @keyframes so the animation doesn't depend on Tailwind config */}
      <style>{`
        @keyframes seatModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes seatModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes seatModalScaleIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes seatModalScaleOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(12px) scale(0.96); }
        }
      `}</style>

      <main
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
        style={{
          animation: `${isClosing ? 'seatModalFadeOut' : 'seatModalFadeIn'} 180ms ease-out forwards`,
        }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
      >
        <div
          className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl"
          style={{
            animation: `${isClosing ? 'seatModalScaleOut' : 'seatModalScaleIn'} 180ms ease-out forwards`,
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleClose();
            }}
            aria-label="Close seat selection"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Reservation flow</p>
          <h1 className="mt-2 text-2xl font-normal text-black">Confirm your seat</h1>
          <p className="mt-2 text-sm text-gray-600">Choose a seat and confirm the reservation for trip #{tripId}.</p>

          <form onSubmit={handleReserve} className="mt-6 space-y-4">
            {tripLoading ? <p className="text-sm text-gray-600">Loading seats...</p> : null}

            {!tripLoading && availableSeats.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
                    </svg>
                    Driver
                  </div>
                  <span className="text-[11px] uppercase tracking-wide text-gray-400">Front of bus</span>
                </div>

                <p className="mb-3 text-sm font-medium text-gray-700">Select your seat</p>

                <div className="space-y-2 overflow-x-auto">
                  {seatRows.map((row, rowIndex) => (
                    <div
                      key={`row-${rowIndex}`}
                      className="grid grid-cols-[repeat(2,1.875rem)_1rem_repeat(2,1.875rem)] items-center justify-center gap-x-1.5 sm:grid-cols-[repeat(2,2rem)_1rem_repeat(2,2rem)]"
                    >
                      <div className="col-span-2 col-start-1 flex items-center gap-1.5">
                        {row.left.map((seat) => (
                          <Seat key={seat} seat={seat} />
                        ))}
                      </div>

                      <div className="col-start-3 flex h-7.5 items-center justify-center sm:h-8" aria-hidden="true">
                        <div className="h-full w-px bg-gray-400" />
                      </div>

                      <div className="col-span-2 col-start-4 flex items-center gap-1.5">
                        {row.isStairsRow ? (
                          <div className="col-span-2 flex h-7.5 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-100 text-gray-400 sm:h-8">
                            <StairsIcon className="h-2.5 w-2.5" />
                            <span className="text-[8px] font-medium uppercase tracking-wide sm:text-[9px]">Door</span>
                          </div>
                        ) : (
                          row.right.map((seat) => <Seat key={seat} seat={seat} />)
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-4 w-3.5 rounded-t-[5px] rounded-b-xs border border-gray-300 bg-white" />
                    Available
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-4 w-3.5 rounded-t-[5px] rounded-b-xs bg-blue-600" />
                    Selected
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StairsIcon className="text-gray-400" />
                    Door
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Seats are derived from the vehicle capacity, and confirmed reservations will decrement availability on the backend.
                </p>
              </div>
            ) : !tripLoading ? (
              <p className="text-sm text-amber-600">This trip response does not include seat capacity yet, so the seat picker cannot be shown.</p>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Confirming...' : 'Confirm reservation'}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleClose();
                }}
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default function TripReservationPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  if (!tripId) return null;

  return (
    <SeatSelectionModal
      tripId={tripId}
      onClose={() => navigate(-1)}
      onBooked={() => navigate('/dashboard/customer/history', { replace: true })}
    />
  );
}