<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Customer;
use App\Entity\Partner;
use App\Entity\Reservation;
use App\Entity\Review;
use App\Entity\Route;
use App\Entity\Trip;
use App\Entity\Vehicle;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Symfony\Bundle\SecurityBundle\Security;

class SetEntityOwnerListener
{
    public function __construct(
        private readonly Security $security,
    ) {
    }

    public function prePersist(LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$entity instanceof Vehicle && !$entity instanceof Trip && !$entity instanceof Route && !$entity instanceof Reservation
            && !$entity instanceof Review) {
            return;
        }

        $user = $this->security->getUser();

        if ($user instanceof Customer && $entity instanceof Reservation) {
            $entity->setCustomer($user);
        }

        if ($user instanceof Customer && $entity instanceof Review) {
            $entity->setCustomer($user);
        }

        if (!$user instanceof Partner) {
            return;
        }

        if ($entity instanceof Vehicle && $entity->getOwner() === null) {
            $entity->setOwner($user);
        }

        if ($entity instanceof Route && $entity->getOwner() === null) {
            $entity->setOwner($user);
        }

        if ($entity instanceof Trip && $entity->getPartner() === null) {
            $entity->setPartner($user);
        }
    }
}
