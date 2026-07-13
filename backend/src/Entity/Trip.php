<?php

namespace App\Entity;

use App\Enum\TripStatus;
use App\Repository\TripRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\Response;
use App\Controller\TripStatusController;

#[ORM\Entity(repositoryClass: TripRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(
            security: 'is_granted("PUBLIC_ACCESS") or is_granted("ROLE_CUSTOMER")',
            normalizationContext: ['groups' => ['trip:read']]
        ),
        new Get(
            security: 'is_granted("PUBLIC_ACCESS") or is_granted("ROLE_CUSTOMER")',
            normalizationContext: ['groups' => ['trip:read']]
        ),
        new Post(
            security: 'is_granted("ROLE_PARTNER")',
            denormalizationContext: ['groups' => ['trip:write']]
        ),
        new Patch(
            security: 'is_granted("ROLE_ADMIN") or is_granted("ROLE_PARTNER") and object.getPartner() == user',
            denormalizationContext: ['groups' => ['trip:write']]
        ),
        new Delete(
            security: 'is_granted("ROLE_PARTNER") or is_granted("ROLE_ADMIN")'
        ),
        
        // Custom Trip Status update operations
        new Patch(
            name: 'api_trip_start',
            uriTemplate: '/trips/{id}/start',
            controller: TripStatusController::class . '::start',
            security: 'is_granted("ROLE_PARTNER")',
            validate: false,
            openapi: new Operation(
                summary: 'Start a trip',
                description: 'Changes trip status from SCHEDULED to IN_PROGRESS.',
                responses: [
                    '200' => new Response(description: 'Trip started successfully')
                ]
            )
        ),
        new Patch(
            name: 'api_trip_complete',
            uriTemplate: '/trips/{id}/complete',
            controller: TripStatusController::class . '::complete',
            security: 'is_granted("ROLE_PARTNER")',
            validate: false,
            openapi: new Operation(
                summary: 'Complete a trip',
                description: 'Changes trip status from IN_PROGRESS to COMPLETED.',
                responses: [
                    '200' => new Response(description: 'Trip completed successfully')
                ]
            )
        ),
        new Patch(
            name: 'api_trip_cancel',
            uriTemplate: '/trips/{id}/cancel',
            controller: TripStatusController::class . '::cancel',
            security: 'is_granted("ROLE_PARTNER")',
            validate: false,
            openapi: new Operation(
                summary: 'Cancel a trip',
                description: 'Changes trip status to CANCELED and cancels all confirmed reservations.',
                responses: [
                    '200' => new Response(description: 'Trip cancelled successfully')
                ]
            )
        ),
    ],
    description: 'A trip with a specific route, vehicle, departure time, and price. Partners can create, update, and delete their own trips.'
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

    #[Groups(['trip:read'])]
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

    /**
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'trip')]
    private Collection $reservations;

    /**
     * @var Collection<int, Review>
     */
    #[ORM\OneToMany(targetEntity: Review::class, mappedBy: 'trip', orphanRemoval: true)]
    private Collection $reviews;

    public function __construct()
    {
        $this->status = TripStatus::SCHEDULED;
        $this->reservations = new ArrayCollection();
        $this->reviews = new ArrayCollection();
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
        // Compute available seats on-the-fly from vehicle capacity minus confirmed reservations
        if ($this->vehicle === null || $this->vehicle->getSeatCapacity() === null) {
            return null;
        }

        return $this->vehicle->getSeatCapacity();
    }

    public function getStatus(): TripStatus
    {
        return $this->status;
    }

    private function setStatus(TripStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function start(): void
    {
        if (!$this->status->canTransitionTo(TripStatus::IN_PROGRESS)) {
            throw new BadRequestHttpException(sprintf('Cannot start a trip that is %s.', $this->status->value));
        }
        $this->status = TripStatus::IN_PROGRESS;
    }

    public function complete(): void
    {
        if (!$this->status->canTransitionTo(TripStatus::COMPLETED)) {
            throw new BadRequestHttpException(sprintf('Cannot complete a trip that is %s.', $this->status->value));
        }
        $this->status = TripStatus::COMPLETED;
    }

    public function cancel(): void
    {
        if (!$this->status->canTransitionTo(TripStatus::CANCELED)) {
            throw new BadRequestHttpException(sprintf('Cannot cancel a trip that is %s.', $this->status->value));
        }
        $this->status = TripStatus::CANCELED;
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

    /**
     * @return Collection<int, Reservation>
     */
    public function getReservations(): Collection
    {
        return $this->reservations;
    }

    public function addReservation(Reservation $reservation): static
    {
        if (!$this->reservations->contains($reservation)) {
            $this->reservations->add($reservation);
            $reservation->setTrip($this);
        }

        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        if ($this->reservations->removeElement($reservation)) {
            // set the owning side to null (unless already changed)
            if ($reservation->getTrip() === $this) {
                $reservation->setTrip(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Review>
     */
    public function getReviews(): Collection
    {
        return $this->reviews;
    }

    public function addReview(Review $review): static
    {
        if (!$this->reviews->contains($review)) {
            $this->reviews->add($review);
            $review->setTrip($this);
        }

        return $this;
    }

    public function removeReview(Review $review): static
    {
        if ($this->reviews->removeElement($review)) {
            // set the owning side to null (unless already changed)
            if ($review->getTrip() === $this) {
                $review->setTrip(null);
            }
        }

        return $this;
    }
}