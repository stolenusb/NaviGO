<?php

declare(strict_types=1);

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Customer;
use App\Entity\Notification;
use App\Entity\Partner;
use App\Entity\Reservation;
use App\Entity\Review;
use App\Entity\Route;
use App\Entity\Trip;
use App\Entity\Vehicle;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Automatically scopes queries so Partners can only access their own Vehicles and Trips.
 *
 * - For GET /api/vehicles and GET /api/trips (collection): filters by the logged-in Partner
 * - For GET /api/vehicles/{id} and GET /api/trips/{id} (item): adds a WHERE clause
 * - POST/PATCH/DELETE are handled by the security attribute on the operation
 */
class PartnerExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(
        private readonly Security $security,
    ) {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    public function applyToItem(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, array $identifiers, ?Operation $operation = null, array $context = []): void
    {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    private function addWhere(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        // Only apply to Vehicle, Trip, Route, Reservation, and Review entities
        if (!in_array($resourceClass, [Vehicle::class, Trip::class, Route::class, Reservation::class, Review::class, Notification::class], true)) {
            return;
        }

        $user = $this->security->getUser();

        // Admin sees everything — no filter (except notifications)
        if ($user instanceof Partner && in_array('ROLE_ADMIN', $user->getRoles(), true) && Notification::class !== $resourceClass) {
            return;
        }

        // If no user is logged in (public access), don't filter
        if (!$user instanceof Partner && !$user instanceof Customer) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        if (Vehicle::class === $resourceClass) {
            // Filter vehicles where Owner matches the logged-in Partner
            if ($user instanceof Partner) {
                $queryBuilder->andWhere(sprintf('%s.Owner = :current_partner', $rootAlias))
                    ->setParameter('current_partner', $user);
            }
        }

        if (Route::class === $resourceClass) {
            // Filter routes where owner matches the logged-in Partner
            if ($user instanceof Partner) {
                $queryBuilder->andWhere(sprintf('%s.owner = :current_partner', $rootAlias))
                    ->setParameter('current_partner', $user);
            }
        }

        if (Trip::class === $resourceClass) {
            // Filter trips where partner matches the logged-in Partner
            if ($user instanceof Partner) {
                $queryBuilder->andWhere(sprintf('%s.partner = :current_partner', $rootAlias))
                    ->setParameter('current_partner', $user);
            }
        }

        if (Reservation::class === $resourceClass) {
            if ($user instanceof Customer) {
                // Customer sees only their own reservations
                $queryBuilder->andWhere(sprintf('%s.customer = :current_customer', $rootAlias))
                    ->setParameter('current_customer', $user);
            }

            if ($user instanceof Partner) {
                // Partner sees reservations for their trips only (join through Trip)
                $queryBuilder->andWhere(sprintf('%s.trip IN (SELECT t.id FROM App\\Entity\\Trip t WHERE t.partner = :current_partner)', $rootAlias))
                    ->setParameter('current_partner', $user);
            }
        }

        if (Notification::class === $resourceClass) {
            $queryBuilder->andWhere(sprintf('%s.recipient = :current_recipient', $rootAlias))
                ->setParameter('current_recipient', $user);
        }

        if (Review::class === $resourceClass) {
            if ($user instanceof Customer) {
                // Customer sees only their own reviews
                $queryBuilder->andWhere(sprintf('%s.customer = :current_customer', $rootAlias))
                    ->setParameter('current_customer', $user);
            }

            if ($user instanceof Partner) {
                // Partner sees reviews for their trips only (join through Trip)
                $queryBuilder->andWhere(sprintf('%s.trip IN (SELECT t.id FROM App\\Entity\\Trip t WHERE t.partner = :current_partner)', $rootAlias))
                    ->setParameter('current_partner', $user);
            }
        }
    }
}
