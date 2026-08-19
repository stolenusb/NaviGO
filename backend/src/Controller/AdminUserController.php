<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Administrator;
use App\Entity\Customer;
use App\Entity\Partner;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[Route('/api/admin')]
#[IsGranted('ROLE_ADMIN')]
final class AdminUserController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    #[Route('/users', name: 'api_admin_create_user', methods: ['POST'])]
    public function createUser(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'A JSON object is required.'], 400);
        }

        $user = match ($payload['accountType'] ?? 'customer') {
            'admin' => new Administrator(),
            'partner' => new Partner(),
            'customer' => new Customer(),
            default => null,
        };
        if (!$user instanceof User) {
            return $this->json(['message' => 'accountType must be customer, partner, or admin.'], 400);
        }

        $this->applyFields($user, $payload);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $this->json($this->serializeUser($user), 201);
    }

    #[Route('/users/{id}/password', name: 'api_admin_update_user_password', methods: ['PATCH'])]
    public function updatePassword(User $user, Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        $password = is_array($payload) ? ($payload['password'] ?? null) : null;
        if (!is_string($password) || strlen($password) < 8) {
            return $this->json(['message' => 'Password must contain at least 8 characters.'], 422);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $this->entityManager->flush();

        return $this->json(['message' => 'Password updated successfully.']);
    }

    private function applyFields(User $user, array $payload): void
    {
        if (isset($payload['email'])) $user->setEmail((string) $payload['email']);
        if (isset($payload['phone'])) $user->setPhone((string) $payload['phone']);
        if (isset($payload['password'])) $user->setPassword($this->passwordHasher->hashPassword($user, (string) $payload['password']));
        if ($user instanceof Customer || $user instanceof Administrator) {
            if (isset($payload['firstName'])) $user->setFirstName((string) $payload['firstName']);
            if (isset($payload['lastName'])) $user->setLastName((string) $payload['lastName']);
        }
        if ($user instanceof Partner) {
            if (isset($payload['companyName'])) $user->setCompanyName((string) $payload['companyName']);
            if (isset($payload['address'])) $user->setAddress((string) $payload['address']);
            if (isset($payload['description'])) $user->setDescription((string) $payload['description']);
        }
        $user->setRoles(match (true) {
            $user instanceof Administrator => ['ROLE_ADMIN'],
            $user instanceof Partner => ['ROLE_PARTNER'],
            default => ['ROLE_CUSTOMER'],
        });
    }

    private function serializeUser(User $user): array
    {
        $type = $user instanceof Administrator ? 'administrators' : ($user instanceof Partner ? 'partners' : 'customers');

        return [
            '@id' => '/api/'.$type.'/'.$user->getId(),
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'phone' => $user->getPhone(),
            'accountType' => $type === 'administrators' ? 'admin' : rtrim($type, 's'),
            'firstName' => method_exists($user, 'getFirstName') ? $user->getFirstName() : null,
            'lastName' => method_exists($user, 'getLastName') ? $user->getLastName() : null,
            'companyName' => method_exists($user, 'getCompanyName') ? $user->getCompanyName() : null,
            'address' => method_exists($user, 'getAddress') ? $user->getAddress() : null,
            'description' => method_exists($user, 'getDescription') ? $user->getDescription() : null,
        ];
    }
}