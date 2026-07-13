<?php

namespace App\Service;

use App\Entity\Trip;
use App\Enum\ReservationStatus;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Handles trip lifecycle transitions with transaction safety and side effects.
 */
class TripService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {}

    public function startTrip(Trip $trip): Trip
    {
        $this->entityManager->wrapInTransaction(function () use ($trip) {
            $trip->start();
            $this->entityManager->flush();
        });

        return $trip;
    }

    public function completeTrip(Trip $trip): Trip
    {
        $this->entityManager->wrapInTransaction(function () use ($trip) {
            $trip->complete();
            $this->entityManager->flush();
        });

        return $trip;
    }

    public function cancelTrip(Trip $trip): Trip
    {
        $this->entityManager->wrapInTransaction(function () use ($trip) {
            $trip->cancel();

            // Cancel all confirmed reservations for this trip
            foreach ($trip->getReservations() as $reservation) {
                if ($reservation->getStatus() === ReservationStatus::CONFIRMED) {
                    $reservation->setStatus(ReservationStatus::CANCELLED);
                    $reservation->setSeatNumber(null);
                }
            }

            $this->entityManager->flush();
        });

        return $trip;
    }
}