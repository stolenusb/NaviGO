<?php

namespace App\Entity;

use App\Repository\RouteRepository;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;

#[ORM\Entity(repositoryClass: RouteRepository::class)]
#[ApiResource] // <-- MUST BE HERE
class Route
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?City $departureCity = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?City $destinationCity = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDepartureCity(): ?City
    {
        return $this->departureCity;
    }

    public function setDepartureCity(?City $departureCity): static
    {
        $this->departureCity = $departureCity;

        return $this;
    }

    public function getDestinationCity(): ?City
    {
        return $this->destinationCity;
    }

    public function setDestinationCity(?City $destinationCity): static
    {
        $this->destinationCity = $destinationCity;

        return $this;
    }
}
