<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Trip;
use App\Enum\TripStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Trip>
 */
class TripRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Trip::class);
    }

    /**
     * @return Trip[]
     */
    public function searchByRouteAndDepartureDate(?string $departureCity = null, ?string $arrivalCity = null, ?string $departureDate = null): array
    {
        $qb = $this->createQueryBuilder('t')
            ->leftJoin('t.route', 'r')
            ->leftJoin('r.departureCity', 'dc')
            ->leftJoin('r.destinationCity', 'ac')
            ->addSelect('r', 'dc', 'ac')
            ->andWhere('t.status = :status')
            ->setParameter('status', TripStatus::SCHEDULED);

        if ($departureCity) {
            $qb->andWhere('LOWER(dc.name) LIKE :departureCity')
                ->setParameter('departureCity', '%'.mb_strtolower($departureCity).'%');
        }

        if ($arrivalCity) {
            $qb->andWhere('LOWER(ac.name) LIKE :arrivalCity')
                ->setParameter('arrivalCity', '%'.mb_strtolower($arrivalCity).'%');
        }

        if ($departureDate) {
            $start = new \DateTimeImmutable($departureDate.' 00:00:00');
            $end = $start->modify('+1 day');

            $qb->andWhere('t.departureTime >= :startDate')
                ->andWhere('t.departureTime < :endDate')
                ->setParameter('startDate', $start)
                ->setParameter('endDate', $end);
        }

        return $qb
            ->orderBy('t.departureTime', 'ASC')
            ->getQuery()
            ->getResult();
    }

    //    /**
    //     * @return Trip[] Returns an array of Trip objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('t.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Trip
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
