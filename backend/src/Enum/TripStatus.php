<?php

declare(strict_types=1);

namespace App\Enum;

enum TripStatus: string
{
    case SCHEDULED = 'scheduled';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case CANCELED = 'canceled';

    /**
    * @return TripStatus[] The statuses this case can transition to
    */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::SCHEDULED => [self::IN_PROGRESS, self::CANCELED],
            self::IN_PROGRESS => [self::COMPLETED, self::CANCELED],
            self::COMPLETED => [],     // terminal — nothing allowed
            self::CANCELED => [],      // terminal — nothing allowed
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return in_array($newStatus, $this->allowedTransitions(), true);
    }
}
