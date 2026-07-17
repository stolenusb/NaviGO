<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\CreateAdminCommand;
use App\Entity\Administrator;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class CreateAdminCommandTest extends TestCase
{
    public function testItCreatesAnewAdminWhenEmailDoesNotExist(): void
    {
        $repository = $this->getMockBuilder(EntityRepository::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['find', 'findAll', 'findBy', 'findOneBy'])
            ->getMock();
        $repository->method('findOneBy')->willReturn(null);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->method('getRepository')->willReturn($repository);
        $entityManager->expects($this->once())->method('persist')->with($this->isInstanceOf(Administrator::class));
        $entityManager->expects($this->once())->method('flush');

        $passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $passwordHasher->expects($this->once())
            ->method('hashPassword')
            ->willReturn('hashed-password');

        $command = new CreateAdminCommand($entityManager, $passwordHasher);
        $tester = new CommandTester($command);
        $exitCode = $tester->execute([
            'email' => 'admin@example.com',
            'password' => 'secret',
            'firstName' => 'Admin',
            'lastName' => 'User',
        ]);

        self::assertSame(0, $exitCode);
        self::assertStringContainsString('created successfully', $tester->getDisplay());
    }
}
