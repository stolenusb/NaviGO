<?php

declare(strict_types=1);

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Http\Event\LogoutEvent;

#[AsEventListener(event: LogoutEvent::class)]
class LogoutListener
{
    public function __invoke(LogoutEvent $event): void
    {
        $token = $event->getToken();

        if ($token === null) {
            $response = new JsonResponse(
                ['message' => 'JWT Token not found!'], 
                JsonResponse::HTTP_UNAUTHORIZED
            );
        } else {
            $response = new JsonResponse(
                ['message' => 'Successfully logged out'], 
                JsonResponse::HTTP_OK
            );
        }

        $event->setResponse($response);
    }
}