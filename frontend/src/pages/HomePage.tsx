import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { apiClient } from '../services/api/client';
import SeatSelection from '../components/trips/SeatSelection';
import { createPortal } from 'react-dom';

type Trip = {
  id?: number;
  departureTime?: string;
  price?: number;
  status?: string;
  availableSeats?: number | null;
  vehicle?: string | { id?: number; seatCapacity?: number | null };
  route?: {
    departureCity?: { name?: string };
    destinationCity?: { name?: string };
  };
};

type City = {
  id?: number;
  name?: string;
};

const formatTripDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatTripPrice = (value?: number) => (typeof value === 'number' ? `${value.toFixed(2)} DH` : 'N/A');

const formatTripTitle = (trip: Trip) =>
  `${trip.route?.departureCity?.name ?? 'N/A'} → ${trip.route?.destinationCity?.name ?? 'N/A'}`;

export default function HomePage() {
  const searchFormRef = useRef<HTMLFormElement>(null);
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activeCityField, setActiveCityField] = useState<'departure' | 'arrival' | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [reservedSeats, setReservedSeats] = useState<number[]>([]);
  const [vehicleSeatCapacity, setVehicleSeatCapacity] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [expandedTripIds, setExpandedTripIds] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const cityNames = useMemo(
    () =>
      (Array.isArray(cities) ? cities : [])
        .flatMap((city) => {
          if (!city) return [];

          const rawName =
            typeof city.name === 'string'
              ? city.name
              : typeof (city as { '@id'?: string; '@type'?: string; label?: string; title?: string }).label === 'string'
                ? (city as { label?: string }).label
                : typeof (city as { title?: string }).title === 'string'
                  ? (city as { title?: string }).title
                  : '';

          const name = (rawName ?? '').trim();
          return name ? [name] : [];
        })
        .filter((name, index, list) => list.indexOf(name) === index),
    [cities],
  );

  const scheduledTrips = useMemo(() => trips.filter((trip) => trip.status === 'scheduled'), [trips]);

  const activeTrip = useMemo(() => trips.find((trip) => trip.id === activeTripId) ?? null, [trips, activeTripId]);

  const activeCityValue = activeCityField === 'departure' ? departureCity : arrivalCity;

  const isTripExpanded = (trip: Trip, index: number) => {
    if (typeof trip.id === 'number') return expandedTripIds.includes(trip.id);
    return index === 0;
  };

  const toggleTrip = (trip: Trip) => {
    if (typeof trip.id !== 'number') return;
    setExpandedTripIds((current) =>
      current.includes(trip.id!) ? current.filter((id) => id !== trip.id) : [...current, trip.id!],
    );
  };

  const openSeatSelection = (tripId: number | null) => {
    setActiveTripId(tripId);
    setSelectedSeat(null);
    setBookingError('');
  };

  const closeSeatSelection = () => {
    setActiveTripId(null);
    setSelectedSeat(null);
    setBookingError('');
    setConfirmOpen(false);
    setBookingSuccess(null);
  };

    const handleReviewReservation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeTripId === null || selectedSeat === null) {
      setBookingError('Please select a seat before booking your reservation.');
      return;
    }

    setBookingError('');
    setConfirmOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (activeTripId === null || selectedSeat === null) return;

    setBooking(true);
    setBookingError('');

    try {
      await apiClient.createReservation({
        trip: `/api/trips/${activeTripId}`,
        seatNumber: selectedSeat,
      });
      setConfirmOpen(false);
      setBookingSuccess(
        `You're booked! Seat ${selectedSeat} on ${activeTrip ? formatTripTitle(activeTrip) : 'this trip'} is confirmed.`,
      );
    } catch (err) {
      setBookingError((err as { message?: string })?.message ?? 'Unable to create reservation.');
      setConfirmOpen(false);
    } finally {
      setBooking(false);
    }
  };

  const filteredCityNames = useMemo(() => {
    const normalized = activeCityValue.trim().toLowerCase();
    return normalized === ''
      ? cityNames
      : cityNames.filter((name) => name.toLowerCase().includes(normalized));
  }, [activeCityValue, cityNames]);

  const selectedCitySetter = activeCityField === 'departure' ? setDepartureCity : setArrivalCity;

  const closeCityDropdown = () => {
    setActiveCityField(null);
    setHighlightedIndex(0);
  };

  const openCityDropdown = (field: 'departure' | 'arrival') => {
    setActiveCityField(field);
    setHighlightedIndex(0);
  };

  const handleCityFocus = (field: 'departure' | 'arrival') => {
    openCityDropdown(field);
  };

  const handleCityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeCityField) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, filteredCityNames.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === 'Enter' && filteredCityNames[highlightedIndex]) {
      event.preventDefault();
      selectedCitySetter(filteredCityNames[highlightedIndex]);
      closeCityDropdown();
    }

    if (event.key === 'Escape') {
      closeCityDropdown();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchFormRef.current && !searchFormRef.current.contains(event.target as Node)) {
        closeCityDropdown();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      setCitiesLoading(true);
      try {
        const data = await apiClient.getCities();

        const normalizedCities = Array.isArray(data)
          ? data
          : Array.isArray((data as { member?: City[] }).member)
            ? (data as { member?: City[] }).member ?? []
            : Array.isArray((data as { 'hydra:member'?: City[] })['hydra:member'])
              ? (data as { 'hydra:member'?: City[] })['hydra:member'] ?? []
              : [];

        setCities(normalizedCities);
      } catch {
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    void loadCities();
  }, []);

  useEffect(() => {
    const loadReservedSeats = async () => {
      if (activeTripId === null) {
        setReservedSeats([]);
        setVehicleSeatCapacity(null);
        return;
      }

      try {
        const trip = trips.find((item) => item.id === activeTripId) ?? null;
        if (trip) {
          if (typeof trip.vehicle === 'object' && trip.vehicle) {
            setVehicleSeatCapacity(trip.vehicle.seatCapacity ?? null);
          } else {
            try {
              const tripData = await apiClient.getTrip(`/api/trips/${activeTripId}`);
              if (typeof tripData.vehicle === 'object' && tripData.vehicle) {
                setVehicleSeatCapacity(tripData.vehicle.seatCapacity ?? null);
              } else if (typeof tripData.vehicle === 'string') {
                const vehicle = await apiClient.getVehicle(tripData.vehicle);
                setVehicleSeatCapacity(vehicle.seatCapacity ?? null);
              } else {
                setVehicleSeatCapacity(null);
              }
            } catch {
              setVehicleSeatCapacity(null);
            }
          }
        }

        const reservationsResponse = await apiClient.getReservations();
        const reservations = Array.isArray(reservationsResponse)
          ? reservationsResponse
          : (reservationsResponse as { member?: Array<{ seatNumber?: number | null; trip?: any; status?: string }>; 'hydra:member'?: Array<{ seatNumber?: number | null; trip?: any; status?: string }> }).member ??
            (reservationsResponse as { member?: Array<{ seatNumber?: number | null; trip?: any; status?: string }>; 'hydra:member'?: Array<{ seatNumber?: number | null; trip?: any; status?: string }> })['hydra:member'] ??
            [];

        const currentTripSeats = reservations
          .filter((reservation) => {
            if (reservation.status === 'cancelled') return false;
            if (typeof reservation.trip === 'string') {
              return reservation.trip.endsWith(`/api/trips/${activeTripId}`);
            }
            return reservation.trip?.id === activeTripId;
          })
          .map((reservation) => reservation.seatNumber)
          .filter((seat): seat is number => typeof seat === 'number');

        setReservedSeats(currentTripSeats);
      } catch {
        setReservedSeats([]);
      }
    };

    void loadReservedSeats();
  }, [activeTripId]);

  useEffect(() => {
    if (activeTripId === null) return;
    console.debug('Reserved seats for trip', activeTripId, reservedSeats);
  }, [activeTripId, reservedSeats]);

  useEffect(() => {
    if (activeTripId === null) return;
    console.debug('SeatSelection props', {
      activeTripId,
      reservedSeats,
      seatCount: vehicleSeatCapacity,
    });
  }, [activeTripId, reservedSeats, vehicleSeatCapacity]);

  const seatCount = vehicleSeatCapacity ?? trips.find((trip) => trip.id === activeTripId)?.availableSeats ?? 40;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiClient.getTrips({
        departureCity,
        arrivalCity,
        departureTime,
      });

      const normalizedTrips = Array.isArray(data)
        ? data
        : Array.isArray((data as { member?: Trip[] }).member)
          ? (data as { member?: Trip[] }).member ?? []
          : Array.isArray((data as { 'hydra:member'?: Trip[] })['hydra:member'])
            ? (data as { 'hydra:member'?: Trip[] })['hydra:member'] ?? []
            : [];

      setTrips(normalizedTrips);
      setExpandedTripIds([]);
    } catch {
      setError('Unable to load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <section className="mx-auto mt-10 max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <form ref={searchFormRef} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 md:items-end">
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-700">
              Departure city
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  value={departureCity}
                  onFocus={() => handleCityFocus('departure')}
                  onChange={(e) => {
                    setDepartureCity(e.target.value);
                    setActiveCityField('departure');
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleCityKeyDown}
                  placeholder={citiesLoading ? 'Loading cities...' : 'Casablanca'}
                  autoComplete="off"
                />
                {activeCityField === 'departure' && filteredCityNames.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                    {filteredCityNames.map((name, index) => (
                      <button
                        key={name}
                        type="button"
                        className={`block w-full px-3 py-2 text-left text-xs ${
                          index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setDepartureCity(name);
                          closeCityDropdown();
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="flex flex-col gap-2 text-xs font-medium text-gray-700">
              Arrival city
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  value={arrivalCity}
                  onFocus={() => handleCityFocus('arrival')}
                  onChange={(e) => {
                    setArrivalCity(e.target.value);
                    setActiveCityField('arrival');
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleCityKeyDown}
                  placeholder={citiesLoading ? 'Loading cities...' : 'Rabat'}
                  autoComplete="off"
                />
                {activeCityField === 'arrival' && filteredCityNames.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                    {filteredCityNames.map((name, index) => (
                      <button
                        key={name}
                        type="button"
                        className={`block w-full px-3 py-2 text-left text-xs ${
                          index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setArrivalCity(name);
                          closeCityDropdown();
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="flex flex-col gap-2 text-xs font-medium text-gray-700">
              Departure time
              <input
                type="date"
                className="rounded-2xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />
            </label>

            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                className="h-10 w-full rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search trips'}
              </button>
            </div>

            {error ? <p className="md:col-span-4 text-xs text-red-600">{error}</p> : null}
          </form>
        </section>

        <section className="mx-auto mt-10 max-w-6xl">
          <h2 className="text-sm font-medium text-gray-900">Available trips</h2>
          <p className="mt-1 text-sm text-gray-600">Tap a trip to see details, then book your seat.</p>

          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-gray-600">Searching trips...</p> : null}
            {!loading && scheduledTrips.length === 0 ? (
              <p className="text-sm text-gray-600">No scheduled trips found. Try a search above.</p>
            ) : null}

            {scheduledTrips.map((trip, index) => {
              const expanded = isTripExpanded(trip, index);

              return (
                <article
                  key={trip.id ?? index}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  <div className="flex w-full items-center gap-3 px-4 py-4 sm:px-5">
                    <button
                      type="button"
                      onClick={() => toggleTrip(trip)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      aria-expanded={expanded}
                    >
                      <span
                        className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 sm:text-base">
                          {formatTripTitle(trip)}
                        </h3>
                        <p className="text-sm text-gray-600">{formatTripDateTime(trip.departureTime)}</p>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-[17px] font-semibold leading-tight text-gray-900 sm:text-lg">
                        {formatTripPrice(trip.price)}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openSeatSelection(trip.id ?? null);
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                        aria-label={`Book a reservation for trip ${trip.route?.departureCity?.name ?? 'Departure'} to ${trip.route?.destinationCity?.name ?? 'Arrival'}`}
                      >
                        Select Trip
                      </button>
                    </div>
                  </div>

                  <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="min-h-0 overflow-hidden border-t border-gray-100 bg-gray-50 px-5">
                      <div className="py-4 text-sm text-gray-600">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Departure</span>
                            <span className="mt-1 block font-medium text-gray-900">{trip.route?.departureCity?.name ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Arrival</span>
                            <span className="mt-1 block font-medium text-gray-900">{trip.route?.destinationCity?.name ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Time</span>
                            <span className="mt-1 block font-medium text-gray-900">{formatTripDateTime(trip.departureTime)}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-[0.16em] text-gray-400">Seats left</span>
                            <span className="mt-1 block font-medium text-gray-900">{trip.availableSeats ?? 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {activeTripId !== null
          ? createPortal(
              <div className="fixed inset-0 z-9999 flex justify-end bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]">
                <div
                  className="relative flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-3 shadow-2xl animate-[slideInRight_220ms_ease-out] sm:max-w-88 sm:p-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={closeSeatSelection}
                    className="absolute right-3 top-3 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900"
                    aria-label="Close seat selection"
                  >
                    ✕
                  </button>

                                {bookingSuccess ? (
                <div className="mt-8 space-y-4">
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <p className="text-sm font-semibold text-emerald-800">Reservation confirmed</p>
                    <p className="text-xs text-emerald-700">{bookingSuccess}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSeatSelection}
                    className="w-full rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                  >
                    Done
                  </button>
                </div>
              ) : confirmOpen ? (
                <div className="mt-8 space-y-4">
                  <div>
                    <p className="pr-6 text-sm font-semibold leading-tight text-gray-900">Confirm your booking</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {activeTrip ? formatTripTitle(activeTrip) : 'This trip'} · Seat {selectedSeat}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-600">This reservation will cost</p>
                    <p className="mt-0.5 text-lg font-semibold text-gray-900">
                      {activeTrip ? formatTripPrice(activeTrip.price) : 'N/A'}
                    </p>
                  </div>

                  {bookingError ? <p className="text-xs text-red-600">{bookingError}</p> : null}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleConfirmBooking()}
                        disabled={booking}
                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {booking ? 'Booking...' : 'Confirm booking'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmOpen(false)}
                        disabled={booking}
                        className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="mt-8 space-y-3" onSubmit={handleReviewReservation}>
                    <div>
                      <p className="pr-6 text-sm font-semibold leading-tight text-gray-900">
                        {activeTrip ? formatTripTitle(activeTrip) : 'Select your seat'}
                      </p>
                      {activeTrip ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-600">
                          <span>{formatTripDateTime(activeTrip.departureTime)}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-medium text-gray-900">{formatTripPrice(activeTrip.price)}</span>
                          <span className="text-gray-300">•</span>
                          <span>{activeTrip.availableSeats ?? 'N/A'} seats left</span>
                        </div>
                      ) : null}
                    </div>

                    <SeatSelection
                      seats={Array.from({ length: seatCount }, (_, index) => index + 1)}
                      reservedSeats={reservedSeats}
                      selectedSeat={selectedSeat}
                      onSelectSeat={(seat) => {
                        setSelectedSeat(seat);
                        setBookingError('');
                      }}
                    />

                    {bookingError ? <p className="text-xs text-red-600">{bookingError}</p> : null}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={selectedSeat === null}
                      >
                        Book reservation
                      </button>
                      <button
                        type="button"
                        onClick={closeSeatSelection}
                        className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                </div>
              </div>,
              document.body,
            )
          : null}
      </main>
    </>
  );
}