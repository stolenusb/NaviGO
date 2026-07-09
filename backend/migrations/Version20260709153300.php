<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260709153300 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add partial unique index on reservation seat, drop available_seats from trip, make seat_number nullable';
    }

    public function up(Schema $schema): void
    {
        // Make seat_number nullable (cancelled reservations free their seat)
        $this->addSql('ALTER TABLE reservation ALTER seat_number DROP NOT NULL');

        // Drop the denormalized available_seats counter from trip (computed on-the-fly now)
        $this->addSql('ALTER TABLE trip DROP available_seats');

        // Partial unique index: only one non-cancelled reservation can hold a given seat on a trip
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CONFIRMED_SEAT ON reservation (trip_id, seat_number) WHERE status != \'CANCELLED\'');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_CONFIRMED_SEAT');
        $this->addSql('ALTER TABLE reservation ALTER seat_number SET NOT NULL');
        $this->addSql('ALTER TABLE trip ADD available_seats INT NOT NULL');
    }
}