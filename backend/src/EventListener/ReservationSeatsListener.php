<?php

namespace App\EventListener;

use App\Entity\Reservation;
use App\Enum\ReservationStatus;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;

class ReservationSeatsListener
{
    public function prePersist(PrePersistEventArgs $args): void
    {
        $reservation = $args->getObject();
        if (!$reservation instanceof Reservation) {
            return;
        }

        $trip = $reservation->getTrip();
        if ($trip === null) {
            return;
        }

        // 1. GATHER OCCUPIED SEATS (Gap-filling algorithm)
        $occupiedSeats = [];
        foreach ($trip->getReservations() as $existingRes) {
            if ($existingRes->getStatus() !== ReservationStatus::CANCELLED && $existingRes->getSeatNumber() !== null) {
                $occupiedSeats[] = $existingRes->getSeatNumber();
            }
        }

        // Find the lowest available integer starting at 1
        $assignedSeat = 1;
        while (in_array($assignedSeat, $occupiedSeats, true)) {
            $assignedSeat++;
        }

        // 2. VEHICLE CAPACITY SAFETY CHECK
        // If your Vehicle entity has a capacity getter, let's make sure we aren't going over it
        $vehicle = $trip->getVehicle();
        if ($vehicle && method_exists($vehicle, 'getCapacity')) {
            if ($assignedSeat > $vehicle->getCapacity()) {
                throw new \RuntimeException('This vehicle layout is fully occupied. Cannot assign seat number.');
            }
        }

        $reservation->setSeatNumber($assignedSeat);

        // 3. DECREMENT TRIP SEATS
        if ($reservation->getStatus() === ReservationStatus::CONFIRMED) {
            $this->decrementSeats($reservation);

            // Force Doctrine to recognize the updated Trip
            $em = $args->getObjectManager();
            $uow = $em->getUnitOfWork();
            $meta = $em->getClassMetadata(get_class($trip));
            $uow->computeChangeSet($meta, $trip);
        }
    }

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $reservation = $args->getObject();
        if (!$reservation instanceof Reservation) {
            return;
        }

        if ($args->hasChangedField('status')) {
            $oldStatus = $args->getOldValue('status');
            $newStatus = $args->getNewValue('status');
            $trip = $reservation->getTrip();

            if ($trip === null) {
                return;
            }

            // Refund seat back to trip if status changes to CANCELLED
            if ($oldStatus === ReservationStatus::CONFIRMED && $newStatus === ReservationStatus::CANCELLED) {
                $this->incrementSeats($reservation);
                
                $em = $args->getObjectManager();
                $uow = $em->getUnitOfWork();
                $meta = $em->getClassMetadata(get_class($trip));
                $uow->recomputeSingleEntityChangeSet($meta, $trip);
            }
        }
    }

    /**
     * NEW: Handle hard DELETE requests via the API
     */
    public function preRemove(PreRemoveEventArgs $args): void
    {
        $reservation = $args->getObject();
        if (!$reservation instanceof Reservation) {
            return;
        }

        $trip = $reservation->getTrip();
        if ($trip === null) {
            return;
        }

        // Only refund the seat if the reservation being deleted was confirmed
        // (If it was already CANCELLED, the seat was already refunded during the update phase)
        if ($reservation->getStatus() === ReservationStatus::CONFIRMED) {
            $this->incrementSeats($reservation);

            // Force Doctrine to save the updated Trip during a deletion cycle
            $em = $args->getObjectManager();
            $uow = $em->getUnitOfWork();
            $meta = $em->getClassMetadata(get_class($trip));
            $uow->recomputeSingleEntityChangeSet($meta, $trip);
        }
    }

    private function decrementSeats(Reservation $reservation): void
    {
        $trip = $reservation->getTrip();
        $currentSeats = $trip->getAvailableSeats();

        if ($currentSeats === null || $currentSeats <= 0) {
            throw new \RuntimeException(
                sprintf('No available seats left for trip #%d.', $trip->getId())
            );
        }

        $trip->setAvailableSeats($currentSeats - 1);
    }

    private function incrementSeats(Reservation $reservation): void
    {
        $trip = $reservation->getTrip();
        $currentSeats = $trip->getAvailableSeats();
        $trip->setAvailableSeats($currentSeats + 1);
    }
}