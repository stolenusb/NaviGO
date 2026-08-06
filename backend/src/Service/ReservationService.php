<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Customer;
use App\Entity\Reservation;
use App\Entity\Trip;
use App\Enum\ReservationStatus;
use App\Enum\TripStatus;
use App\Repository\ReservationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Handles atomic reservation creation with pessimistic locking.
 */
class ReservationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ReservationRepository $reservationRepository,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function createReservation(Trip $trip, Customer $customer, ?int $requestedSeatNumber = null): Reservation
    {
        // Wrap everything in a transaction with a pessimistic lock
        $reservation = $this->entityManager->wrapInTransaction(function () use ($trip, $customer, $requestedSeatNumber) {
            // 1. Re-fetch the Trip with a pessimistic write lock
            $lockedTrip = $this->entityManager
                ->createQueryBuilder()
                ->select('t')
                ->from(Trip::class, 't')
                ->andWhere('t.id = :id')
                ->setParameter('id', $trip->getId())
                ->getQuery()
                ->setLockMode(\Doctrine\DBAL\LockMode::PESSIMISTIC_WRITE)
                ->getOneOrNullResult();

            if (!$lockedTrip) {
                throw new BadRequestHttpException('Trip not found.');
            }

            // 2. Validate trip status
            $this->validateTripStatus($lockedTrip);

            // 3. Re-read all non-cancelled reservations from the DB (fresh data under lock)
            $existingReservations = $this->reservationRepository->findNonCancelledByTrip($lockedTrip);

            // 4. Compute or validate the requested seat number
            $occupiedSeats = array_map(
                fn (Reservation $r) => $r->getSeatNumber(),
                array_filter($existingReservations, fn (Reservation $r) => null !== $r->getSeatNumber())
            );

            $assignedSeat = $requestedSeatNumber;

            if (null !== $assignedSeat) {
                if (in_array($assignedSeat, $occupiedSeats, true)) {
                    throw new BadRequestHttpException('This seat is already reserved.');
                }
            } else {
                $assignedSeat = 1;
                while (in_array($assignedSeat, $occupiedSeats, true)) {
                    ++$assignedSeat;
                }
            }

            // 5. Check vehicle capacity
            $vehicle = $lockedTrip->getVehicle();
            if ($vehicle && null !== $vehicle->getSeatCapacity()) {
                if ($assignedSeat > $vehicle->getSeatCapacity()) {
                    throw new BadRequestHttpException('This vehicle is fully occupied. No seats available.');
                }
            }

            // 6. Create and persist the reservation
            $reservation = new Reservation();
            $reservation->setCustomer($customer);
            $reservation->setTrip($lockedTrip);
            $reservation->setSeatNumber($assignedSeat);
            $reservation->setStatus(ReservationStatus::CONFIRMED);

            $this->entityManager->persist($reservation);

            return $reservation;
        });

        $this->notificationService->createNotification('Your reservation #'.$reservation->getId().' for trip #'.$trip->getId().' is confirmed.', $reservation->getCustomer());

        return $reservation;
    }

    public function cancelReservation(Reservation $reservation): Reservation
    {
        if (ReservationStatus::CANCELLED === $reservation->getStatus()) {
            return $reservation;
        }

        $reservation->setStatus(ReservationStatus::CANCELLED);
        $reservation->setSeatNumber(null);

        $this->entityManager->persist($reservation);
        $this->entityManager->flush();

        return $reservation;
    }

    private function validateTripStatus(Trip $trip): void
    {
        match ($trip->getStatus()) {
            TripStatus::CANCELED => throw new BadRequestHttpException('Cannot book a reservation, this trip is cancelled.'),
            TripStatus::IN_PROGRESS => throw new BadRequestHttpException('Cannot book a reservation, this trip is in progress.'),
            TripStatus::COMPLETED => throw new BadRequestHttpException('Cannot book a reservation, this trip was completed.'),
            default => null,
        };
    }
}
