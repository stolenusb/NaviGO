<?php

namespace App\Controller;

use App\Entity\Partner;
use App\Enum\PartnerStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
class AdminPartnerController extends AbstractController
{
    #[Route(
        path: '/api/partners/{id}/approve',
        name: 'api_partner_approve',
        methods: ['PATCH'],
    )]
    #[IsGranted('ROLE_ADMIN')]
    public function approve(
        Partner $partner,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if ($partner->getStatus() !== PartnerStatus::PENDING) {
            return $this->json([
                'error' => sprintf('Partner is already %s.', $partner->getStatus()->value),
            ], 400);
        }

        $partner->setStatus(PartnerStatus::APPROVED);
        $entityManager->flush();

        return $this->json([
            'message' => sprintf('Partner "%s" has been approved.', $partner->getCompanyName()),
            'status' => PartnerStatus::APPROVED->value,
        ]);
    }

    #[Route(
        path: '/api/partners/{id}/reject',
        name: 'api_partner_reject',
        methods: ['PATCH'],
    )]
    #[IsGranted('ROLE_ADMIN')]
    public function reject(
        Partner $partner,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if ($partner->getStatus() !== PartnerStatus::PENDING) {
            return $this->json([
                'error' => sprintf('Partner is already %s.', $partner->getStatus()->value),
            ], 400);
        }

        $partner->setStatus(PartnerStatus::REJECTED);
        $entityManager->flush();

        return $this->json([
            'message' => sprintf('Partner "%s" has been rejected.', $partner->getCompanyName()),
            'status' => PartnerStatus::REJECTED->value,
        ]);
    }
}