<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Notification;
use App\Entity\User;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

class NotificationServiceTest extends TestCase
{
    public function testCreateNotificationPersistsAndFlushesNotification(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(Notification::class));
        $entityManager->expects($this->once())
            ->method('flush');

        $service = new NotificationService($entityManager);
        $recipient = $this->createMock(User::class);

        $notification = $service->createNotification('Hello', $recipient);

        self::assertInstanceOf(Notification::class, $notification);
        self::assertSame('Hello', $notification->getContent());
        self::assertSame($recipient, $notification->getRecipient());
    }
}
