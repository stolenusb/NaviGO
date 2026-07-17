<?php

declare(strict_types=1);

namespace App\Tests\EventListener;

use App\Entity\Partner;
use App\Enum\PartnerStatus;
use App\EventListener\JWTMissingPartnerCheckListener;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;

class JWTMissingPartnerCheckListenerTest extends TestCase
{
    public function testApprovedPartnerIsAllowed(): void
    {
        $listener = new JWTMissingPartnerCheckListener();
        $event = $this->createMock(AuthenticationSuccessEvent::class);
        $partner = $this->createMock(Partner::class);

        $partner->method('getStatus')->willReturn(PartnerStatus::APPROVED);
        $event->method('getUser')->willReturn($partner);

        $listener->onAuthenticationSuccess($event);
        self::assertTrue(true);
    }

    public function testNonApprovedPartnerIsRejected(): void
    {
        $listener = new JWTMissingPartnerCheckListener();
        $event = $this->createMock(AuthenticationSuccessEvent::class);
        $partner = $this->createMock(Partner::class);

        $partner->method('getStatus')->willReturn(PartnerStatus::PENDING);
        $event->method('getUser')->willReturn($partner);

        $this->expectException(CustomUserMessageAuthenticationException::class);
        $listener->onAuthenticationSuccess($event);
    }
}
