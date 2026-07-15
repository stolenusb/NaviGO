<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\ReviewRepository;
use App\State\ReviewProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ReviewRepository::class)]
#[ApiResource(
    description: 'Represents a customer review for a completed trip. Reviews are public to read and only the original customer can create or delete them.',
    normalizationContext: ['groups' => ['review:read']],
    denormalizationContext: ['groups' => ['review:write']],
    operations: [
        new GetCollection(
            security: 'is_granted("PUBLIC_ACCESS")',
        ),
        new Get(
            security: 'is_granted("PUBLIC_ACCESS")',
        ),
        new Post(
            security: 'is_granted("ROLE_CUSTOMER")',
            processor: ReviewProcessor::class
        ),
        new Delete(
            security: 'is_granted("ROLE_ADMIN") or is_granted("ROLE_CUSTOMER") and object.getCustomer() == user'
        ),
    ]
)]
class Review
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups(['review:read', 'review:write'])]
    #[Assert\NotNull]
    #[Assert\Range(min: 1, max: 5, notInRangeMessage: 'Rating must be between {{ min }} and {{ max }}.')]
    #[ORM\Column]
    private ?float $rating = null;
    
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[Groups(['review:read'])]
    #[ORM\ManyToOne(inversedBy: 'reviews')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Customer $customer = null;

    #[Groups(['review:read', 'review:write'])]
    #[ORM\ManyToOne(inversedBy: 'reviews')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Trip $trip = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRating(): ?float
    {
        return $this->rating;
    }

    public function setRating(float $rating): static
    {
        $this->rating = $rating;

        return $this;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function setComment(?string $comment): static
    {
        $this->comment = $comment;

        return $this;
    }

    public function getCustomer(): ?Customer
    {
        return $this->customer;
    }

    public function setCustomer(?Customer $customer): static
    {
        $this->customer = $customer;

        return $this;
    }

    public function getTrip(): ?Trip
    {
        return $this->trip;
    }

    public function setTrip(?Trip $trip): static
    {
        $this->trip = $trip;

        return $this;
    }
}