<?php

namespace App\EventListener;

use App\Entity\Reservation;
use App\Enum\ReservationStatus;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\Persistence\Event\LifecycleEventArgs;

class ReservationSeatsListener
{
    public function prePersist(LifecycleEventArgs $args): void
    {
        $reservation = $args->getObject();
        if (!$reservation instanceof Reservation) {
            return;
        }

        // Only decrement seats if the new reservation is created as CONFIRMED
        if ($reservation->getStatus() === ReservationStatus::CONFIRMED) {
            $this->decrementSeats($reservation);
        }
    }

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $reservation = $args->getObject();
        if (!$reservation instanceof Reservation) {
            return;
        }

        // Only act when the status field changes
        if ($args->hasChangedField('status')) {
            $oldStatus = $args->getOldValue('status');
            $newStatus = $args->getNewValue('status');

            // PENDING → CONFIRMED: decrement Trip's availableSeats
            if ($oldStatus === ReservationStatus::PENDING && $newStatus === ReservationStatus::CONFIRMED) {
                $this->decrementSeats($reservation);
            }

            // CONFIRMED → CANCELLED: refund the seat back to Trip
            if ($oldStatus === ReservationStatus::CONFIRMED && $newStatus === ReservationStatus::CANCELLED) {
                $this->incrementSeats($reservation);
            }
        }
    }

    /**
     * Decrements the Trip's availableSeats by 1.
     * Throws if no seats remain.
     */
    private function decrementSeats(Reservation $reservation): void
    {
        $trip = $reservation->getTrip();
        if ($trip === null) {
            return;
        }

        $currentSeats = $trip->getAvailableSeats();

        if ($currentSeats === null || $currentSeats <= 0) {
            throw new \RuntimeException(
                sprintf('No available seats left for trip #%d.', $trip->getId())
            );
        }

        $trip->setAvailableSeats($currentSeats - 1);
    }

    /**
     * Increments the Trip's availableSeats by 1 (seat refunded).
     */
    private function incrementSeats(Reservation $reservation): void
    {
        $trip = $reservation->getTrip();
        if ($trip === null) {
            return;
        }

        $currentSeats = $trip->getAvailableSeats();
        $trip->setAvailableSeats($currentSeats + 1);
    }
}