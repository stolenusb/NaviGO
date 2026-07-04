<?php

namespace App\EventListener;

use App\Entity\Partner;
use App\Entity\Trip;
use App\Entity\Vehicle;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Symfony\Bundle\SecurityBundle\Security;

class SetEntityOwnerListener
{
    public function __construct(
        private readonly Security $security,
    ) {}

    public function prePersist(LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();

        if (!$entity instanceof Vehicle && !$entity instanceof Trip) {
            return;
        }

        $user = $this->security->getUser();

        if (!$user instanceof Partner) {
            return;
        }

        if ($entity instanceof Vehicle && $entity->getOwner() === null) {
            $entity->setOwner($user);
        }

        if ($entity instanceof Trip && $entity->getPartner() === null) {
            $entity->setPartner($user);
        }
    }
}