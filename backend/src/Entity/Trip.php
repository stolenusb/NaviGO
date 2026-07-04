<?php

namespace App\Entity;

use App\Enum\TripStatus;
use App\Repository\TripRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;

#[ORM\Entity(repositoryClass: TripRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(
            security: 'is_granted("PUBLIC_ACCESS")',
            normalizationContext: ['groups' => ['trip:read']]
        ),
        new Get(
            security: 'is_granted("PUBLIC_ACCESS")',
            normalizationContext: ['groups' => ['trip:read']]
        ),
        new Post(
            security: 'is_granted("ROLE_PARTNER")',
            denormalizationContext: ['groups' => ['trip:write']]
        ),
        new Patch(
            security: 'is_granted("ROLE_PARTNER")',
            denormalizationContext: ['groups' => ['trip:write']]
        ),
        new Delete(
            security: 'is_granted("ROLE_PARTNER")'
        ),
    ]
)]
class Trip
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups(['trip:read', 'trip:write'])]
    #[Assert\NotBlank]
    #[ORM\Column]
    private ?\DateTime $departureTime = null;

    #[Groups(['trip:read', 'trip:write'])]
    #[Assert\NotBlank]
    #[Assert\Positive]
    #[ORM\Column]
    private ?float $price = null;

    #[Groups(['trip:read', 'trip:write'])]
    #[Assert\NotBlank]
    #[Assert\Positive]
    #[ORM\Column]
    private ?int $availableSeats = null;

    #[Groups(['trip:read'])]
    #[ORM\Column(type: 'string', enumType: TripStatus::class)]
    private TripStatus $status = TripStatus::SCHEDULED;

    #[Groups(['trip:read', 'trip:write'])]
    #[Assert\NotNull]
    #[ORM\ManyToOne(inversedBy: 'trips')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Route $route = null;

    #[Groups(['trip:read', 'trip:write'])]
    #[Assert\NotNull]
    #[ORM\ManyToOne(inversedBy: 'trips')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Vehicle $vehicle = null;

    #[Groups(['trip:read'])]
    #[ORM\ManyToOne(inversedBy: 'trips')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Partner $partner = null;

    public function __construct()
    {
        $this->status = TripStatus::SCHEDULED;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDepartureTime(): ?\DateTime
    {
        return $this->departureTime;
    }

    public function setDepartureTime(\DateTime $departureTime): static
    {
        $this->departureTime = $departureTime;

        return $this;
    }

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(float $price): static
    {
        $this->price = $price;

        return $this;
    }

    public function getAvailableSeats(): ?int
    {
        return $this->availableSeats;
    }

    public function setAvailableSeats(int $availableSeats): static
    {
        $this->availableSeats = $availableSeats;

        return $this;
    }

    public function getStatus(): TripStatus
    {
        return $this->status;
    }

    public function setStatus(TripStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getRoute(): ?Route
    {
        return $this->route;
    }

    public function setRoute(?Route $route): static
    {
        $this->route = $route;

        return $this;
    }

    public function getVehicle(): ?Vehicle
    {
        return $this->vehicle;
    }

    public function setVehicle(?Vehicle $vehicle): static
    {
        $this->vehicle = $vehicle;

        return $this;
    }

    public function getPartner(): ?Partner
    {
        return $this->partner;
    }

    public function setPartner(?Partner $partner): static
    {
        $this->partner = $partner;

        return $this;
    }
}