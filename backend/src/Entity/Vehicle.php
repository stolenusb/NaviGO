<?php

namespace App\Entity;

use App\Repository\VehicleRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;

#[ORM\Entity(repositoryClass: VehicleRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(
            security: 'is_granted("PUBLIC_ACCESS")',
        ),
        new Get(
            security: 'is_granted("PUBLIC_ACCESS")',
        ),
        new Post(
            security: 'is_granted("ROLE_PARTNER")',
        ),
        new Patch(
            security: 'is_granted("ROLE_PARTNER")',
        ),
        new Delete(
            security: 'is_granted("ROLE_PARTNER")',
        ),
    ]
)]
class Vehicle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups(['vehicle:read', 'vehicle:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $brand = null;

    #[Groups(['vehicle:read', 'vehicle:write'])]
    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^[A-Z0-9\-]{2,15}$/', message: 'License plate must be alphanumeric (2-15 characters).')]
    #[ORM\Column(length: 255)]
    private ?string $licensePlate = null;

    #[Groups(['vehicle:read', 'vehicle:write'])]
    #[Assert\NotBlank]
    #[Assert\Positive]
    #[Assert\LessThanOrEqual(50)]
    #[ORM\Column]
    private ?int $seatCapacity = null;

    #[Groups(['vehicle:read', 'vehicle:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $driverName = null;

    #[Groups(['vehicle:read'])]
    #[ORM\ManyToOne(inversedBy: 'vehicles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Partner $Owner = null;

    /**
     * @var Collection<int, Trip>
     */
    #[ORM\OneToMany(targetEntity: Trip::class, mappedBy: 'vehicle', orphanRemoval: true)]
    private Collection $trips;

    public function __construct()
    {
        $this->trips = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBrand(): ?string
    {
        return $this->brand;
    }

    public function setBrand(string $brand): static
    {
        $this->brand = $brand;

        return $this;
    }

    public function getLicensePlate(): ?string
    {
        return $this->licensePlate;
    }

    public function setLicensePlate(string $licensePlate): static
    {
        $this->licensePlate = $licensePlate;

        return $this;
    }

    public function getSeatCapacity(): ?int
    {
        return $this->seatCapacity;
    }

    public function setSeatCapacity(int $seatCapacity): static
    {
        $this->seatCapacity = $seatCapacity;

        return $this;
    }

    public function getDriverName(): ?string
    {
        return $this->driverName;
    }

    public function setDriverName(string $driverName): static
    {
        $this->driverName = $driverName;

        return $this;
    }

    public function getOwner(): ?Partner
    {
        return $this->Owner;
    }

    public function setOwner(?Partner $Owner): static
    {
        $this->Owner = $Owner;

        return $this;
    }

    /**
     * @return Collection<int, Trip>
     */
    public function getTrips(): Collection
    {
        return $this->trips;
    }

    public function addTrip(Trip $trip): static
    {
        if (!$this->trips->contains($trip)) {
            $this->trips->add($trip);
            $trip->setVehicle($this);
        }

        return $this;
    }

    public function removeTrip(Trip $trip): static
    {
        if ($this->trips->removeElement($trip)) {
            // set the owning side to null (unless already changed)
            if ($trip->getVehicle() === $this) {
                $trip->setVehicle(null);
            }
        }

        return $this;
    }
}