<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Reservation;
use App\Service\ReservationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
class ReservationCancelController extends AbstractController
{
    public function __construct(
        private readonly ReservationService $reservationService,
    ) {
    }

    /**
     * Cancel a reservation — updates the reservation to CANCELLED and frees the seat.
     */
    #[IsGranted('ROLE_CUSTOMER')]
    public function __invoke(Reservation $reservation): JsonResponse
    {
        $updatedReservation = $this->reservationService->cancelReservation($reservation);

        return $this->json([
            'message' => 'Reservation cancelled.',
            'status' => $updatedReservation->getStatus()->value,
            'seatNumber' => $updatedReservation->getSeatNumber(),
        ]);
    }
}
