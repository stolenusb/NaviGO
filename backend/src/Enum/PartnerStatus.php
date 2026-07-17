<?php

declare(strict_types=1);

namespace App\Enum;

enum PartnerStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
}
