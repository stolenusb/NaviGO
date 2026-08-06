import { useMemo, useState } from 'react';

type SeatSelectionProps = {
  seats?: number[];
  reservedSeats?: number[];
  onSelectSeat?: (seat: number) => void;
  selectedSeat?: number | null;
};

const SEATS_PER_NORMAL_ROW = 4;
const SEATS_LOST_PER_STAIRS_ROW = 2; // a stairs/door row only seats 2 (left side), not 4

const StairsIcon = ({ className = '' }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M4 20h4v-4h4v-4h4v-4h4" />
  </svg>
);

export default function SeatSelection({
  seats,
  reservedSeats = [],
  onSelectSeat,
  selectedSeat = null,
}: SeatSelectionProps) {
  const availableSeats = useMemo(() => seats ?? Array.from({ length: 40 }, (_, index) => index + 1), [seats]);

  // Size the bus so every seat fits, no matter how many are passed in.
  // Two rows (front + middle) are stairs/door rows and lose 2 seats each,
  // so we pad the naive row estimate to make up for that lost capacity.
  const busRowCount = useMemo(() => {
    const seatCount = availableSeats.length;
    if (seatCount === 0) return 0;
    return Math.max(1, Math.ceil((seatCount + 2 * SEATS_LOST_PER_STAIRS_ROW) / SEATS_PER_NORMAL_ROW));
  }, [availableSeats.length]);

  // Front door is always the first row. The second door sits at the true
  // middle row, in the same right-hand column, so it reads as straight
  // down from the door above it.
  const stairsRowIndices = useMemo(
    () => new Set([0, Math.floor(busRowCount / 2)]),
    [busRowCount]
  );

  const seatRows = useMemo(() => {
    const rows: Array<{ left: number[]; right: number[]; isStairsRow: boolean }> = [];
    let cursor = 0;

    for (let rowIndex = 0; rowIndex < busRowCount && cursor < availableSeats.length; rowIndex += 1) {
      const isStairsRow = stairsRowIndices.has(rowIndex);
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

    // Safety net — if rounding ever leaves seats unplaced, keep adding
    // normal rows until everything has a spot.
    while (cursor < availableSeats.length) {
      const left: number[] = [];
      const right: number[] = [];
      for (let i = 0; i < 2 && cursor < availableSeats.length; i += 1) {
        left.push(availableSeats[cursor]);
        cursor += 1;
      }
      for (let i = 0; i < 2 && cursor < availableSeats.length; i += 1) {
        right.push(availableSeats[cursor]);
        cursor += 1;
      }
      rows.push({ left, right, isStairsRow: false });
    }

    return rows;
  }, [availableSeats, busRowCount, stairsRowIndices]);

  const [localSelectedSeat, setLocalSelectedSeat] = useState<number | null>(null);
  const effectiveSelectedSeat = selectedSeat ?? localSelectedSeat;

  const seatButtonClass = (seat: number) =>
    `flex aspect-square h-7.5 w-[30px] shrink-0 items-center justify-center rounded-lg border p-0 text-[9px] font-semibold leading-none transition sm:h-8 sm:w-8 sm:text-[10px] ${
      reservedSeats.includes(seat)
        ? 'cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400'
        : effectiveSelectedSeat === seat
          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
    }`;

  const Seat = ({ seat }: { seat: number }) => (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!reservedSeats.includes(seat)) {
          setLocalSelectedSeat(seat);
          onSelectSeat?.(seat);
        }
      }}
      disabled={reservedSeats.includes(seat)}
      className={seatButtonClass(seat)}
      style={{ padding: 0, lineHeight: 1 }}
    >
      {seat}
    </button>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
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
    </div>
  );
}