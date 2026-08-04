<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\TripRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class TripCollectionController extends AbstractController
{
    public function __construct(
        private readonly TripRepository $tripRepository,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $trips = $this->tripRepository->searchByRouteAndDepartureDate(
            $request->query->getString('departureCity') ?: null,
            $request->query->getString('arrivalCity') ?: null,
            $request->query->getString('departureTime') ?: null,
        );

        return $this->json($trips, 200, [], ['groups' => ['trip:read']]);
    }
}