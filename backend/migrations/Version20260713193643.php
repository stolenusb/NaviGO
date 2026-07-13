<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260713193643 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE notification ADD is_read BOOLEAN NOT NULL');
        $this->addSql('ALTER TABLE notification ADD created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL');
        $this->addSql('DROP INDEX uniq_confirmed_seat');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CONFIRMED_SEAT ON reservation (trip_id, seat_number) WHERE (status != \'CANCELLED\')');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE notification DROP is_read');
        $this->addSql('ALTER TABLE notification DROP created_at');
        $this->addSql('DROP INDEX UNIQ_CONFIRMED_SEAT');
        $this->addSql('CREATE UNIQUE INDEX uniq_confirmed_seat ON reservation (trip_id, seat_number) WHERE ((status)::text <> \'CANCELLED\'::text)');
    }
}
