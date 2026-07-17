<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Event\LogoutEvent;

#[AsEventListener(event: LogoutEvent::class)]
class LogoutListener
{
    public function __invoke(LogoutEvent $event): void
    {
        $token = $event->getToken();

        if($token == null) {
            $response = new JsonResponse(['message' => 'JWT Token not found!'], Response::HTTP_UNAUTHORIZED);
        } else {
            $response = new JsonResponse(['message' => 'Successfully logged out']);
        }

        $event->setResponse($response);
    }
}