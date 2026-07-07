<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260707224538 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation ADD customer_id INT NOT NULL');
        $this->addSql('ALTER TABLE reservation ADD trip_id INT NOT NULL');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT FK_42C849559395C3F3 FOREIGN KEY (customer_id) REFERENCES customer (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT FK_42C84955A5BC2E0E FOREIGN KEY (trip_id) REFERENCES trip (id) NOT DEFERRABLE');
        $this->addSql('CREATE INDEX IDX_42C849559395C3F3 ON reservation (customer_id)');
        $this->addSql('CREATE INDEX IDX_42C84955A5BC2E0E ON reservation (trip_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation DROP CONSTRAINT FK_42C849559395C3F3');
        $this->addSql('ALTER TABLE reservation DROP CONSTRAINT FK_42C84955A5BC2E0E');
        $this->addSql('DROP INDEX IDX_42C849559395C3F3');
        $this->addSql('DROP INDEX IDX_42C84955A5BC2E0E');
        $this->addSql('ALTER TABLE reservation DROP customer_id');
        $this->addSql('ALTER TABLE reservation DROP trip_id');
    }
}
