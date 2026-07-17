<?php

declare(strict_types=1);

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
        private readonly NotificationService $notificationService,
    ) {
    }

    public function startTrip(Trip $trip): Trip
    {
        $this->entityManager->wrapInTransaction(function () use ($trip) {
            $trip->start();
            $this->entityManager->flush();
            foreach ($trip->getReservations() as $reservation) {
                if (ReservationStatus::CONFIRMED === $reservation->getStatus()) {
                    $this->notificationService->createNotification(
                        'Trip #'.$trip->getId().' has started.',
                        $reservation->getCustomer()
                    );
                }
            }
        });

        return $trip;
    }

    public function completeTrip(Trip $trip): Trip
    {
        $this->entityManager->wrapInTransaction(function () use ($trip) {
            $trip->complete();
            $this->entityManager->flush();
            foreach ($trip->getReservations() as $reservation) {
                if (ReservationStatus::CONFIRMED === $reservation->getStatus()) {
                    $this->notificationService->createNotification(
                        'Trip #'.$trip->getId().' has been completed.',
                        $reservation->getCustomer()
                    );
                }
            }
        });

        return $trip;
    }

    public function cancelTrip(Trip $trip): Trip
    {
        $this->entityManager->wrapInTransaction(function () use ($trip) {
            $trip->cancel();

            // Cancel all confirmed reservations for this trip
            foreach ($trip->getReservations() as $reservation) {
                if (ReservationStatus::CONFIRMED === $reservation->getStatus()) {
                    $reservation->setStatus(ReservationStatus::CANCELLED);
                    $reservation->setSeatNumber(null);
                    $this->notificationService->createNotification(
                        'Trip #'.$trip->getId().' has been cancelled.',
                        $reservation->getCustomer()
                    );
                }
            }

            $this->entityManager->flush();
        });

        return $trip;
    }
}
