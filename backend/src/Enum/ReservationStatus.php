<?php

namespace App\Enum;

enum ReservationStatus: string
{
    case CONFIRMED = 'confirmed';
    case CANCELLED = 'cancelled';
}
