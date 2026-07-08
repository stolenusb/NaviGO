<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260708132354 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE route ADD owner_id INT NOT NULL');
        $this->addSql('ALTER TABLE route ADD CONSTRAINT FK_2C420797E3C61F9 FOREIGN KEY (owner_id) REFERENCES partner (id) NOT DEFERRABLE');
        $this->addSql('CREATE INDEX IDX_2C420797E3C61F9 ON route (owner_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE route DROP CONSTRAINT FK_2C420797E3C61F9');
        $this->addSql('DROP INDEX IDX_2C420797E3C61F9');
        $this->addSql('ALTER TABLE route DROP owner_id');
    }
}
