<?php

namespace App\EventListener;

use App\Entity\Partner;
use App\Enum\PartnerStatus;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;

class JWTMissingPartnerCheckListener
{
    #[AsEventListener(event: 'lexik_jwt_authentication.on_authentication_success')]
    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();

        if ($user instanceof Partner && $user->getStatus() !== PartnerStatus::APPROVED) {
            throw new CustomUserMessageAuthenticationException(
                sprintf('Your partner registration status is currently %s. Access denied until approved.', strtoupper($user->getStatus()->value))
            );
        }
    }
}