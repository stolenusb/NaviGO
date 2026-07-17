<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Creates a notification with content and for a recipient
 */
class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function createNotification(string $content, User $recipient): Notification
    {
        $notification = new Notification();

        $notification->setContent($content);
        $notification->setRecipient($recipient);

        $this->entityManager->persist($notification);
        $this->entityManager->flush();

        return $notification;
    }
}
