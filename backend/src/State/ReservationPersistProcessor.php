<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Reservation;
use App\Entity\Trip;
use App\Service\ReservationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Custom API Platform state processor for Reservation POST operations.
 * Delegates to ReservationService for concurrency-safe seat assignment.
 */
class ReservationPersistProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ReservationService $reservationService,
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param Reservation $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Reservation
    {
        $customer = $this->security->getUser();
        \assert($customer instanceof \App\Entity\Customer);

        \assert($data instanceof Reservation);

        if (null === $data->getTrip()) {
            $payload = $this->getPayload($context);
            $tripIri = $payload['trip'] ?? null;

            if (!is_string($tripIri) || '' === $tripIri) {
                throw new BadRequestHttpException('trip is required.');
            }

            $tripId = (int) basename(parse_url($tripIri, PHP_URL_PATH) ?: '0');
            $trip = $this->entityManager->getRepository(Trip::class)->find($tripId);

            if (!$trip instanceof Trip) {
                throw new BadRequestHttpException('Trip not found.');
            }

            $data->setTrip($trip);
        }

        $seatNumber = $data->getSeatNumber();
        if (null === $seatNumber) {
            $payload = $this->getPayload($context);
            $seatNumber = isset($payload['seatNumber']) ? (int) $payload['seatNumber'] : null;
        }

        if (null === $seatNumber) {
            throw new BadRequestHttpException('seatNumber is required.');
        }

        $reservation = $this->reservationService->createReservation(
            $data->getTrip(),
            $customer,
            $seatNumber,
        );

        return $reservation;
    }

    private function getPayload(array $context): array
    {
        $request = $context['request'] ?? null;

        if (!is_object($request) || !method_exists($request, 'getContent')) {
            return [];
        }

        $decoded = json_decode($request->getContent(), true);

        return is_array($decoded) ? $decoded : [];
    }
}
