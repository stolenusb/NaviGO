<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Reservation;
use App\Service\ReservationService;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Custom API Platform state processor for Reservation POST operations.
 * Delegates to ReservationService for concurrency-safe seat assignment.
 */
class ReservationPersistProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ReservationService $reservationService,
        private readonly Security $security,
    ) {}

    /**
     * @param Reservation $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Reservation
    {
        $customer = $this->security->getUser();
        \assert($customer instanceof \App\Entity\Customer);

        return $this->reservationService->createReservation(
            $data->getTrip(),
            $customer,
        );
    }
}