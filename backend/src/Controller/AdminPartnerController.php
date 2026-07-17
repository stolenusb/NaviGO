<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Partner;
use App\Enum\PartnerStatus;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
class AdminPartnerController extends AbstractController
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {
    }

    /**
     * Approve a pending partner registration.
     */
    #[IsGranted('ROLE_ADMIN')]
    public function approve(
        Partner $partner,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (PartnerStatus::PENDING !== $partner->getStatus()) {
            return $this->json([
                'error' => sprintf('Partner is already %s.', $partner->getStatus()->value),
            ], 400);
        }

        $partner->setStatus(PartnerStatus::APPROVED);
        $entityManager->flush();
        $this->notificationService->createNotification(
            'Your partnership has been approved!',
            $partner
        );

        return $this->json([
            'message' => sprintf('Partner "%s" has been approved.', $partner->getCompanyName()),
            'status' => PartnerStatus::APPROVED->value,
        ]);
    }

    /**
     * Reject a pending partner registration.
     */
    #[IsGranted('ROLE_ADMIN')]
    public function reject(
        Partner $partner,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (PartnerStatus::PENDING !== $partner->getStatus()) {
            return $this->json([
                'error' => sprintf('Partner is already %s.', $partner->getStatus()->value),
            ], 400);
        }

        $partner->setStatus(PartnerStatus::REJECTED);
        $entityManager->flush();
        $this->notificationService->createNotification(
            'Your partnership has been declined!',
            $partner
        );

        return $this->json([
            'message' => sprintf('Partner "%s" has been rejected.', $partner->getCompanyName()),
            'status' => PartnerStatus::REJECTED->value,
        ]);
    }
}
