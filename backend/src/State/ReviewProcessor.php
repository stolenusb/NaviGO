<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Customer;
use App\Entity\Reservation;
use App\Entity\Review;
use App\Enum\ReservationStatus;
use App\Enum\TripStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Security\Core\User\UserInterface;

class ReviewProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    public function process(
        mixed $data,
        Operation $operation,
        array $uriVariables = [],
        array $context = []
    ): mixed {
        /** @var Review $review */
        $review = $data;

        $user = $this->security->getUser();

        if (!$user instanceof UserInterface) {
            throw new UnauthorizedHttpException(
                '',
                'You must be logged in to review a trip.'
            );
        }

        if (!$user instanceof Customer) {
            throw new AccessDeniedHttpException(
                'Only customers can review trips.'
            );
        }

        $trip = $review->getTrip();

        if ($trip === null) {
            throw new BadRequestHttpException('Trip is required.');
        }

        if ($trip->getStatus() !== TripStatus::COMPLETED) {
            throw new BadRequestHttpException(
                'You can only review trips that have been completed.'
            );
        }

        $reservation = $this->entityManager
            ->getRepository(Reservation::class)
            ->findOneBy([
                'customer' => $user,
                'trip' => $trip,
                'status' => ReservationStatus::CONFIRMED,
            ]);

        if ($reservation === null) {
            throw new AccessDeniedHttpException(
                'You must have a confirmed reservation for this trip to leave a review.'
            );
        }

        $existingReview = $this->entityManager
            ->getRepository(Review::class)
            ->findOneBy([
                'customer' => $user,
                'trip' => $trip,
            ]);

        if ($existingReview !== null) {
            throw new BadRequestHttpException(
                'You have already reviewed this trip.'
            );
        }

        // Always set the customer from the authenticated user
        $review->setCustomer($user);

        return $this->persistProcessor->process(
            $review,
            $operation,
            $uriVariables,
            $context
        );
    }
}