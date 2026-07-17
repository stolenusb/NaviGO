<?php

declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\Partner;
use App\Enum\PartnerStatus;
use PHPUnit\Framework\TestCase;

class PartnerTest extends TestCase
{
    public function testPartnerDefaultsToPendingAndPartnerRole(): void
    {
        $partner = new Partner();

        self::assertSame(PartnerStatus::PENDING, $partner->getStatus());
        self::assertContains('ROLE_PARTNER', $partner->getRoles());
    }

    public function testPartnerSettersAssignValues(): void
    {
        $partner = new Partner();

        $partner
            ->setCompanyName('NaviGO LLC')
            ->setDescription('A transport provider with quality service')
            ->setAddress('123 Main Street');

        self::assertSame('NaviGO LLC', $partner->getCompanyName());
        self::assertSame('A transport provider with quality service', $partner->getDescription());
        self::assertSame('123 Main Street', $partner->getAddress());
    }
}
