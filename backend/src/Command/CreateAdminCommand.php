<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Administrator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-admin',
    description: 'Creates a new administrator account.',
)]
class CreateAdminCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Admin email')
            ->addArgument('password', InputArgument::REQUIRED, 'Admin password')
            ->addArgument('firstName', InputArgument::REQUIRED, 'Admin first name')
            ->addArgument('lastName', InputArgument::REQUIRED, 'Admin last name')
            ->addArgument('phone', InputArgument::OPTIONAL, 'Admin phone', '+212600000000');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = $input->getArgument('email');
        $password = $input->getArgument('password');
        $firstName = $input->getArgument('firstName');
        $lastName = $input->getArgument('lastName');
        $phone = $input->getArgument('phone');

        // Check if admin already exists
        $existing = $this->entityManager->getRepository(Administrator::class)
            ->findOneBy(['email' => $email]);

        if ($existing) {
            $io->error(sprintf('An admin with email "%s" already exists.', $email));

            return Command::FAILURE;
        }

        $admin = new Administrator();
        $admin->setEmail($email);
        $admin->setPlainPassword($password);
        $admin->setPhone($phone);
        $admin->setFirstName($firstName);
        $admin->setLastName($lastName);
        $admin->setRoles(['ROLE_ADMIN']);

        // Hash the password
        $hashedPassword = $this->passwordHasher->hashPassword($admin, $password);
        $admin->setPassword($hashedPassword);
        $admin->eraseCredentials();

        $this->entityManager->persist($admin);
        $this->entityManager->flush();

        $io->success(sprintf('Admin "%s %s" (%s) created successfully!', $firstName, $lastName, $email));

        return Command::SUCCESS;
    }
}
