<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Trip;
use App\Service\TripService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
class TripStatusController extends AbstractController
{
    public function __construct(
        private readonly TripService $tripService,
    ) {
    }

    /**
     * Start a trip — changes status from SCHEDULED to IN_PROGRESS.
     */
    #[IsGranted('ROLE_PARTNER')]
    public function start(Trip $trip): JsonResponse
    {
        $this->tripService->startTrip($trip);

        return $this->json([
            'message' => 'Trip started.',
            'status' => $trip->getStatus()->value,
        ]);
    }

    /**
     * Complete a trip — changes status from IN_PROGRESS to COMPLETED.
     */
    #[IsGranted('ROLE_PARTNER')]
    public function complete(Trip $trip): JsonResponse
    {
        $this->tripService->completeTrip($trip);

        return $this->json([
            'message' => 'Trip completed.',
            'status' => $trip->getStatus()->value,
        ]);
    }

    /**
     * Cancel a trip — changes status to CANCELED and cancels all confirmed reservations.
     */
    #[IsGranted('ROLE_PARTNER')]
    public function cancel(Trip $trip): JsonResponse
    {
        $this->tripService->cancelTrip($trip);

        return $this->json([
            'message' => 'Trip cancelled.',
            'status' => $trip->getStatus()->value,
            'reservations_cancelled' => true,
        ]);
    }
}
