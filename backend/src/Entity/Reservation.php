<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\RequestBody;
use ApiPlatform\OpenApi\Model\Response;
use App\Controller\PartnerReservationController;
use App\Enum\ReservationStatus;
use App\Repository\ReservationRepository;
use App\State\ReservationPersistProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ReservationRepository::class)]
#[ORM\Table(name: 'reservation')]
#[ORM\UniqueConstraint(
    name: 'UNIQ_CONFIRMED_SEAT',
    columns: ['trip_id', 'seat_number'],
    options: ['where' => '(status != \'CANCELLED\')'],
)]
#[ApiResource(
    operations: [
        new GetCollection(
            security: 'is_granted("ROLE_CUSTOMER") or is_granted("ROLE_PARTNER") or is_granted("ROLE_ADMIN")',
        ),
        new Get(
            security: 'is_granted("ROLE_CUSTOMER") or is_granted("ROLE_PARTNER") or is_granted("ROLE_ADMIN")',
        ),
        new Post(
            security: 'is_granted("ROLE_CUSTOMER")',
            processor: ReservationPersistProcessor::class,
        ),
        new Patch(
            security: 'is_granted("ROLE_PARTNER") or is_granted("ROLE_ADMIN")',
        ),
        new Delete(
            security: 'is_granted("ROLE_CUSTOMER") or is_granted("ROLE_PARTNER") or is_granted("ROLE_ADMIN")',
        ),
        new Post(
            name: 'api_reservation_for_customer',
            uriTemplate: '/reservations/for-customer',
            controller: PartnerReservationController::class . '::createForCustomer',
            security: 'is_granted("ROLE_PARTNER")',
            deserialize: false,
            openapi: new Operation(
                summary: 'Create a reservation for a customer on behalf of a partner',
                description: 'Allows a partner to book a reservation for a customer on one of their trips.',
                requestBody: new RequestBody(
                    content: new \ArrayObject([
                        'application/json' => [
                            'schema' => [
                                'type' => 'object',
                                'required' => ['customerId', 'tripId'],
                                'properties' => [
                                    'customerId' => [
                                        'type' => 'integer',
                                        'example' => 14,
                                        'description' => 'ID or IRI of the customer'
                                    ],
                                    'tripId' => [
                                        'type' => 'integer',
                                        'example' => 10,
                                        'description' => 'ID or IRI of the trip'
                                    ]
                                ]
                            ]
                        ]
                    ])
                ),
                responses: [
                    '201' => new Response(description: 'Reservation created'),
                    '400' => new Response(description: 'Invalid input'),
                    '403' => new Response(description: 'Unauthorized or not trip owner'),
                    '404' => new Response(description: 'Customer or trip not found')
                ]
            )
        )
    ]
)]
class Reservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ApiProperty(writable: false)]
    #[Groups(['reservation:read'])]
    #[ORM\Column(nullable: true)]
    private ?int $seatNumber = null;

    #[Groups(['reservation:read'])]
    #[ORM\Column(enumType: ReservationStatus::class)]
    private ReservationStatus $status = ReservationStatus::CONFIRMED;

    #[Groups(['reservation:read'])]
    #[ORM\ManyToOne(inversedBy: 'reservation')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Customer $customer = null;

    #[Assert\NotNull]
    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Trip $trip = null;

    public function __construct()
    {
        $this->status = ReservationStatus::CONFIRMED;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSeatNumber(): ?int
    {
        return $this->seatNumber;
    }

    public function setSeatNumber(?int $seatNumber): static
    {
        $this->seatNumber = $seatNumber;

        return $this;
    }

    public function getStatus(): ReservationStatus
    {
        return $this->status;
    }

    public function setStatus(ReservationStatus $status): static
    {
        $this->status = $status;

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