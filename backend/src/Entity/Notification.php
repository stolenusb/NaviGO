<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Patch;
use App\Repository\NotificationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
#[ApiResource(
    description: 'Represents a notification sent to a user. Notifications are visible only to the recipient and can be marked as read.',
    normalizationContext: ['groups' => ['notification:read']],
    denormalizationContext: ['groups' => ['notification:write']],
    operations: [
        new GetCollection(
            security: 'is_granted("ROLE_ADMIN") or is_granted("ROLE_CUSTOMER") or is_granted("ROLE_PARTNER")'
        ),
        new Get(
            security: 'is_granted("ROLE_ADMIN") or (is_granted("ROLE_CUSTOMER") and object.getRecipient() == user) or (is_granted("ROLE_PARTNER") and object.getRecipient() == user)'
        ),
        new Patch(
            security: 'is_granted("ROLE_ADMIN") or (is_granted("ROLE_CUSTOMER") and object.getRecipient() == user) or (is_granted("ROLE_PARTNER") and object.getRecipient() == user)'
        ),
    ]
)]
class Notification
{
    #[Groups(['notification:read'])]
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups(['notification:read'])]
    #[ORM\Column(type: Types::TEXT)]
    private ?string $content = null;

    #[Groups(['notification:read', 'notification:write'])]
    #[ORM\Column(type: 'boolean')]
    private bool $isRead = false;

    #[Groups(['notification:read'])]
    #[ORM\ManyToOne(inversedBy: 'notifications')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $recipient = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getIsRead(): bool
    {
        return $this->isRead;
    }

    public function setIsRead(bool $read): static
    {
        $this->isRead = $read;

        return $this;
    }

    public function getRecipient(): ?User
    {
        return $this->recipient;
    }

    public function setRecipient(?User $recipient): static
    {
        $this->recipient = $recipient;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
