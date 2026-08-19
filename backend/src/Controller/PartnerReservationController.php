<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Customer;
use App\Entity\Partner;
use App\Entity\Reservation;
use App\Entity\Trip;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
class PartnerReservationController extends AbstractController
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {
    }

    /**
     * Create a reservation for a customer on behalf of a partner.
     */
    #[IsGranted('ROLE_PARTNER')]
    public function createForCustomer(
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $customerId = $data['customerId'] ?? null;
        $tripId = $data['tripId'] ?? null;
        $seatNumber = $data['seatNumber'] ?? null;

        if (!$customerId || !$tripId || !is_int($seatNumber) || $seatNumber < 1) {
            return $this->json(['error' => 'customerId, tripId, and a valid seatNumber are required.'], 400);
        }

        // Accept both raw IDs (14) and IRIs (/api/customers/14)
        $customerId = is_string($customerId) ? (int) basename(parse_url($customerId, PHP_URL_PATH)) : (int) $customerId;
        $tripId = is_string($tripId) ? (int) basename(parse_url($tripId, PHP_URL_PATH)) : (int) $tripId;

        $customer = $entityManager->getRepository(Customer::class)->find($customerId);
        $trip = $entityManager->getRepository(Trip::class)->find($tripId);

        if (!$customer) {
            return $this->json(['error' => 'Customer not found.'], 404);
        }

        if (!$trip) {
            return $this->json(['error' => 'Trip not found.'], 404);
        }

        // Ensure the trip belongs to the logged-in partner
        $partner = $this->getUser();
        if (!$partner instanceof Partner) {
            return $this->json(['error' => 'Unauthorized.'], 401);
        }

        $tripPartner = $trip->getPartner();
        if (null === $tripPartner || $tripPartner->getId() !== $partner->getId()) {
            return $this->json(['error' => 'You can only create reservations for your own trips.'], 403);
        }

        foreach ($trip->getReservations() as $existingReservation) {
            if (\App\Enum\ReservationStatus::CANCELLED !== $existingReservation->getStatus() && $existingReservation->getSeatNumber() === $seatNumber) {
                return $this->json(['error' => 'This seat is already reserved.'], 400);
            }
        }

        if (null !== $trip->getVehicle()?->getSeatCapacity() && $seatNumber > $trip->getVehicle()->getSeatCapacity()) {
            return $this->json(['error' => 'This seat does not exist on the selected vehicle.'], 400);
        }

        $reservation = new Reservation();
        $reservation->setCustomer($customer);
        $reservation->setTrip($trip);
        $reservation->setSeatNumber($seatNumber);
        $reservation->setStatus(\App\Enum\ReservationStatus::CONFIRMED);

        $entityManager->persist($reservation);
        $entityManager->flush();
        $this->notificationService->createNotification('You were given a reservation #'.$reservation->getId().' for trip #'.$trip->getId().' is confirmed.', $reservation->getCustomer());

        return $this->json([
            'id' => $reservation->getId(),
            'customer' => '/api/customers/'.$customer->getId(),
            'trip' => '/api/trips/'.$trip->getId(),
            'seatNumber' => $reservation->getSeatNumber(),
            'status' => $reservation->getStatus()->value,
        ], 201);
    }
}
