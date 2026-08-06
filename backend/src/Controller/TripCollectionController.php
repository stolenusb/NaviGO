<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Partner;
use App\Entity\Trip;
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
        $partner = $this->getUser();
        if (!$partner instanceof Partner) {
            $partner = null;
        }

        $trips = $this->tripRepository->searchByRouteAndDepartureDate(
            $request->query->getString('departureCity') ?: null,
            $request->query->getString('arrivalCity') ?: null,
            $request->query->getString('departureTime') ?: null,
            $partner,
        );

        $payload = array_map(static function (Trip $trip): array {
            $route = $trip->getRoute();
            $vehicle = $trip->getVehicle();

            return [
                '@id' => sprintf('/api/trips/%d', $trip->getId()),
                'id' => $trip->getId(),
                'departureTime' => $trip->getDepartureTime()?->format(DATE_ATOM),
                'price' => $trip->getPrice(),
                'status' => $trip->getStatus()->value,
                'availableSeats' => $trip->getAvailableSeats(),
                'route' => $route ? [
                    '@id' => sprintf('/api/routes/%d', $route->getId()),
                    'id' => $route->getId(),
                    'departureCity' => $route->getDepartureCity() ? [
                        '@id' => sprintf('/api/cities/%d', $route->getDepartureCity()->getId()),
                        'id' => $route->getDepartureCity()->getId(),
                        'name' => $route->getDepartureCity()->getName(),
                    ] : null,
                    'destinationCity' => $route->getDestinationCity() ? [
                        '@id' => sprintf('/api/cities/%d', $route->getDestinationCity()->getId()),
                        'id' => $route->getDestinationCity()->getId(),
                        'name' => $route->getDestinationCity()->getName(),
                    ] : null,
                ] : null,
                'vehicle' => $vehicle ? [
                    '@id' => sprintf('/api/vehicles/%d', $vehicle->getId()),
                    'id' => $vehicle->getId(),
                    'brand' => $vehicle->getBrand(),
                    'licensePlate' => $vehicle->getLicensePlate(),
                    'seatCapacity' => $vehicle->getSeatCapacity(),
                    'driverName' => $vehicle->getDriverName(),
                ] : null,
                'partner' => $trip->getPartner() ? sprintf('/api/partners/%d', $trip->getPartner()->getId()) : null,
            ];
        }, $trips);

        return $this->json($payload);
    }
}
