<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Partner;
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
    ) {}

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
        // Only apply to Vehicle and Trip entities
        if (!in_array($resourceClass, [Vehicle::class, Trip::class], true)) {
            return;
        }

        $user = $this->security->getUser();

        // If no user is logged in (public access), don't filter — the security attribute
        // on the operation will block write access, and public GET is allowed for all trips/vehicles
        if (!$user instanceof Partner) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        if ($resourceClass === Vehicle::class) {
            // Filter vehicles where Owner matches the logged-in Partner
            $queryBuilder->andWhere(sprintf('%s.Owner = :current_partner', $rootAlias))
                ->setParameter('current_partner', $user);
        }

        if ($resourceClass === Trip::class) {
            // Filter trips where partner matches the logged-in Partner
            $queryBuilder->andWhere(sprintf('%s.partner = :current_partner', $rootAlias))
                ->setParameter('current_partner', $user);
        }
    }
}