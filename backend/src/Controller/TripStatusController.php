<?php

namespace App\Controller;

use App\Entity\Trip;
use App\Service\TripService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
class TripStatusController extends AbstractController
{
    public function __construct(
        private readonly TripService $tripService,
    ) {}

    #[Route(
        path: '/api/trips/{id}/start',
        name: 'api_trip_start',
        methods: ['PATCH'],
    )]
    #[IsGranted('ROLE_PARTNER')]
    public function start(Trip $trip): JsonResponse
    {
        $this->tripService->startTrip($trip);

        return $this->json([
            'message' => 'Trip started.',
            'status' => $trip->getStatus()->value,
        ]);
    }

    #[Route(
        path: '/api/trips/{id}/complete',
        name: 'api_trip_complete',
        methods: ['PATCH'],
    )]
    #[IsGranted('ROLE_PARTNER')]
    public function complete(Trip $trip): JsonResponse
    {
        $this->tripService->completeTrip($trip);

        return $this->json([
            'message' => 'Trip completed.',
            'status' => $trip->getStatus()->value,
        ]);
    }

    #[Route(
        path: '/api/trips/{id}/cancel',
        name: 'api_trip_cancel',
        methods: ['PATCH'],
    )]
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