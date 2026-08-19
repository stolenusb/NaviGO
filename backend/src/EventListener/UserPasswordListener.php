<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\User;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserPasswordListener
{
    public function __construct(private readonly UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function prePersist(User $user, PrePersistEventArgs $event): void
    {
        $this->hashPlainPassword($user);
    }

    public function preUpdate(User $user, PreUpdateEventArgs $event): void
    {
        if (null === $user->getPlainPassword()) {
            return;
        }

        if (!$user->getCurrentPassword() || !$this->passwordHasher->isPasswordValid($user, $user->getCurrentPassword())) {
            throw new BadRequestHttpException('The current password is incorrect.');
        }

        $this->hashPlainPassword($user);
        $event->getObjectManager()->getUnitOfWork()->recomputeSingleEntityChangeSet(
            $event->getObjectManager()->getClassMetadata(User::class),
            $user,
        );
    }

    private function hashPlainPassword(User $user): void
    {
        if (null !== $user->getPlainPassword()) {
            $user->setPassword($this->passwordHasher->hashPassword($user, $user->getPlainPassword()));
        }

        $user->setPlainPassword(null);
        $user->setCurrentPassword(null);
    }
}