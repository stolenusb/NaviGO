<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ReservationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class ReservationCollectionController extends AbstractController
{
    public function __construct(
        private readonly ReservationRepository $reservationRepository,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $user = $this->getUser();

        if (null === $user) {
            return $this->json(['error' => 'Unauthorized.'], 401);
        }

        $reservations = $this->reservationRepository->findBy(
            ['customer' => $user],
            ['id' => 'DESC'],
        );

        $payload = array_map(static function ($reservation): array {
            $trip = $reservation->getTrip();
            $route = $trip?->getRoute();

            return [
                'id' => $reservation->getId(),
                'seatNumber' => $reservation->getSeatNumber(),
                'status' => $reservation->getStatus()->value,
                'customer' => $reservation->getCustomer()?->getId() ? '/api/customers/'.$reservation->getCustomer()->getId() : null,
                'trip' => $trip ? [
                    'id' => $trip->getId(),
                    'departureTime' => $trip->getDepartureTime()?->format(DATE_ATOM),
                    'price' => $trip->getPrice(),
                    'status' => $trip->getStatus()->value,
                    'route' => $route ? [
                        'id' => $route->getId(),
                        'departureCity' => $route->getDepartureCity() ? [
                            'id' => $route->getDepartureCity()->getId(),
                            'name' => $route->getDepartureCity()->getName(),
                        ] : null,
                        'destinationCity' => $route->getDestinationCity() ? [
                            'id' => $route->getDestinationCity()->getId(),
                            'name' => $route->getDestinationCity()->getName(),
                        ] : null,
                    ] : null,
                    'vehicle' => $trip->getVehicle()?->getId() ? '/api/vehicles/'.$trip->getVehicle()->getId() : null,
                    'partner' => $trip->getPartner()?->getId() ? '/api/partners/'.$trip->getPartner()->getId() : null,
                ] : null,
            ];
        }, $reservations);

        return $this->json($payload);
    }
}