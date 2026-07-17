<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\PartnerStatus;
use App\Repository\PartnerRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\Response;
use App\Controller\AdminPartnerController;

#[ORM\Entity(repositoryClass: PartnerRepository::class)]
#[ApiResource(
    shortName: 'Partner',
    description: 'Represents a trip provider partner profile. Registerable publicly, manageable by the partner themselves or an administrator.',
    operations: [
        new GetCollection(security: 'is_granted("ROLE_ADMIN")'),
        new Get(security: 'is_granted("ROLE_ADMIN") or object == user'),
        new Patch(security: 'is_granted("ROLE_ADMIN") or object == user'),
        new Delete(security: 'is_granted("ROLE_ADMIN")'),
        new Post(security: 'is_granted("PUBLIC_ACCESS")'),
        new Patch(
            name: 'api_partner_approve',
            uriTemplate: '/partners/{id}/approve',
            controller: AdminPartnerController::class . '::approve',
            security: 'is_granted("ROLE_ADMIN")',
            validate: false,
            openapi: new Operation(
                summary: 'Approve a partner registration',
                description: 'Admin approves a pending partner registration.',
                responses: [
                    '200' => new Response(description: 'Partner approved successfully'),
                    '401' => new Response(description: 'Unauthorized'),
                    '403' => new Response(description: 'Admin privileges required'),
                    '404' => new Response(description: 'Partner not found'),
                ]
            )
        ),
        new Patch(
            name: 'api_partner_reject',
            uriTemplate: '/partners/{id}/reject',
            controller: AdminPartnerController::class . '::reject',
            security: 'is_granted("ROLE_ADMIN")',
            validate: false,
            openapi: new Operation(
                summary: 'Reject a partner registration',
                description: 'Admin rejects a pending partner registration.',
                responses: [
                    '200' => new Response(description: 'Partner rejected successfully'),
                    '401' => new Response(description: 'Unauthorized'),
                    '403' => new Response(description: 'Admin privileges required'),
                    '404' => new Response(description: 'Partner not found'),
                ]
            )
        ),
    ],
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']]
)]
class Partner extends User
{
    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $companyName = null;

    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(min: 10, max: 5000)]
    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 255)]
    #[ORM\Column(length: 255)]
    private ?string $address = null;

    public function getCompanyName(): ?string
    {
        return $this->companyName;
    }

    public function setCompanyName(string $companyName): static
    {
        $this->companyName = $companyName;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(string $address): static
    {
        $this->address = $address;

        return $this;
    }

    #[Groups(['user:read'])]
    #[ORM\Column(type: 'string', enumType: PartnerStatus::class)]
    private PartnerStatus $status = PartnerStatus::PENDING;

    /**
     * @var Collection<int, Vehicle>
     */
    #[ORM\OneToMany(targetEntity: Vehicle::class, mappedBy: 'owner', orphanRemoval: true)]
    private Collection $vehicles;

    /**
     * @var Collection<int, Route>
     */
    #[ORM\OneToMany(targetEntity: Route::class, mappedBy: 'owner', orphanRemoval: true)]
    private Collection $routes;

    /**
     * @var Collection<int, Trip>
     */
    #[ORM\OneToMany(targetEntity: Trip::class, mappedBy: 'partner', orphanRemoval: true)]
    private Collection $trips;

    public function __construct()
    {
        parent::__construct();

        $this->vehicles = new ArrayCollection();
        $this->routes = new ArrayCollection();
        $this->setRoles(['ROLE_PARTNER']);
        // Ensures new partners automatically default to PENDING status
        $this->setStatus(\App\Enum\PartnerStatus::PENDING);
        $this->trips = new ArrayCollection();
    }

    public function getStatus(): PartnerStatus
    {
        return $this->status;
    }

    public function setStatus(PartnerStatus $status): self
    {
        $this->status = $status;
        return $this;
    }

    /**
     * @return Collection<int, Vehicle>
     */
    public function getVehicles(): Collection
    {
        return $this->vehicles;
    }

    public function addVehicle(Vehicle $vehicle): static
    {
        if (!$this->vehicles->contains($vehicle)) {
            $this->vehicles->add($vehicle);
            $vehicle->setOwner($this);
        }

        return $this;
    }

    public function removeVehicle(Vehicle $vehicle): static
    {
        if ($this->vehicles->removeElement($vehicle)) {
            // set the owning side to null (unless already changed)
            if ($vehicle->getOwner() === $this) {
                $vehicle->setOwner(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Route>
     */
    public function getRoutes(): Collection
    {
        return $this->routes;
    }

    public function addRoute(Route $route): static
    {
        if (!$this->routes->contains($route)) {
            $this->routes->add($route);
            $route->setOwner($this);
        }

        return $this;
    }

    public function removeRoute(Route $route): static
    {
        if ($this->routes->removeElement($route)) {
            // set the owning side to null (unless already changed)
            if ($route->getOwner() === $this) {
                $route->setOwner(null);
            }
        }

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
            $trip->setPartner($this);
        }

        return $this;
    }

    public function removeTrip(Trip $trip): static
    {
        if ($this->trips->removeElement($trip)) {
            // set the owning side to null (unless already changed)
            if ($trip->getPartner() === $this) {
                $trip->setPartner(null);
            }
        }

        return $this;
    }
}
