<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Administrator;
use App\Entity\Partner;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
class CurrentUserController extends AbstractController
{
    #[Route(
        '/api/user',
        name: 'api_current_user',
        methods: ['GET']
    )]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function __invoke(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'accountType' => $this->resolveAccountType($user),
            'firstName' => method_exists($user, 'getFirstName') ? $user->getFirstName() : null,
            'lastName' => method_exists($user, 'getLastName') ? $user->getLastName() : null,
            'companyName' => method_exists($user, 'getCompanyName') ? $user->getCompanyName() : null,
            'phone' => $user->getPhone(),
            'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM),
        ]);
    }

    private function resolveAccountType(User $user): string
    {
        return match (true) {
            $user instanceof Administrator => 'admin',
            $user instanceof Partner => 'partner',
            default => 'customer',
        };
    }
}