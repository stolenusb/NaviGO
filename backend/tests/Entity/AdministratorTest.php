<?php

declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\Administrator;
use PHPUnit\Framework\TestCase;

class AdministratorTest extends TestCase
{
    public function testAdministratorSettersPersistNames(): void
    {
        $admin = new Administrator();
        $admin->setFirstName('Jane');
        $admin->setLastName('Doe');

        self::assertSame('Jane', $admin->getFirstName());
        self::assertSame('Doe', $admin->getLastName());
    }
}
