<?php

declare(strict_types=1);

namespace App\Tests\EventListener;

use App\EventListener\LogoutListener;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Event\LogoutEvent;

class LogoutListenerTest extends TestCase
{
    public function testLogoutReturnsSuccessResponseWhenTokenExists(): void
    {
        $listener = new LogoutListener();
        $event = $this->createMock(LogoutEvent::class);
        $token = $this->createStub(TokenInterface::class);

        $event->expects($this->once())
            ->method('getToken')
            ->willReturn($token);
        $event->expects($this->once())
            ->method('setResponse')
            ->with($this->callback(static function (Response $response): bool {
                $payload = json_decode($response->getContent() ?: '', true);

                return Response::HTTP_OK === $response->getStatusCode()
                    && ($payload['message'] ?? null) === 'Successfully logged out';
            }));

        $listener($event);
    }

    public function testLogoutReturnsUnauthorizedWhenTokenMissing(): void
    {
        $listener = new LogoutListener();
        $event = $this->createMock(LogoutEvent::class);

        $event->expects($this->once())
            ->method('getToken')
            ->willReturn(null);
        $event->expects($this->once())
            ->method('setResponse')
            ->with($this->callback(static function (Response $response): bool {
                $payload = json_decode($response->getContent() ?: '', true);

                return Response::HTTP_UNAUTHORIZED === $response->getStatusCode()
                    && ($payload['message'] ?? null) === 'JWT Token not found!';
            }));

        $listener($event);
    }
}
