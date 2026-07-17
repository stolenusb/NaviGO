<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Reservation;
use App\Entity\Trip;
use App\Enum\ReservationStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Reservation>
 */
class ReservationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reservation::class);
    }

    /**
     * @return Reservation[] All non-cancelled reservations for a trip, ordered by seat number
     */
    public function findNonCancelledByTrip(Trip $trip): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.trip = :trip')
            ->andWhere('r.status != :cancelled')
            ->setParameter('trip', $trip)
            ->setParameter('cancelled', ReservationStatus::CANCELLED)
            ->orderBy('r.seatNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Count non-cancelled reservations for a trip.
     */
    public function countNonCancelledByTrip(Trip $trip): int
    {
        return (int) $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->andWhere('r.trip = :trip')
            ->andWhere('r.status != :cancelled')
            ->setParameter('trip', $trip)
            ->setParameter('cancelled', ReservationStatus::CANCELLED)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
