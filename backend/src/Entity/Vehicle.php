<?php

namespace App\Entity;

use App\Repository\VehicleRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VehicleRepository::class)]
class Vehicle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $brand = null;

    #[ORM\Column(length: 255)]
    private ?string $licensePlate = null;

    #[ORM\Column]
    private ?int $seatCapacity = null;

    #[ORM\Column(length: 255)]
    private ?string $driverName = null;

    #[ORM\ManyToOne(inversedBy: 'vehicles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Partner $Owner = null;

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
}
