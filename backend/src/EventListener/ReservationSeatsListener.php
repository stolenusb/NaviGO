<?php

namespace App\EventListener;

use App\Entity\Reservation;
use App\Enum\ReservationStatus;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;

/**
 * Handles seat number cleanup when reservations are cancelled or deleted.
 *
 * NOTE: Reservation creation (seat assignment) is now handled by
 * App\Service\ReservationService with pessimistic locking for concurrency safety.
 */
class ReservationSeatsListener
{
    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $reservation = $args->getObject();
        if (!$reservation instanceof Reservation) {
            return;
        }

        if ($args->hasChangedField('status')) {
            $oldStatus = $args->getOldValue('status');
            $newStatus = $args->getNewValue('status');

            // When a reservation is cancelled, free its seat number
            if ($oldStatus === ReservationStatus::CONFIRMED && $newStatus === ReservationStatus::CANCELLED) {
                $reservation->setSeatNumber(null);
            }
        }
    }

    /**
     * When a confirmed reservation is hard-deleted, free its seat number.
     */
    public function preRemove(PreRemoveEventArgs $args): void
    {
        $reservation = $args->getObject();
        if (!$reservation instanceof Reservation) {
            return;
        }

        if ($reservation->getStatus() === ReservationStatus::CONFIRMED) {
            $reservation->setSeatNumber(null);
        }
    }
}