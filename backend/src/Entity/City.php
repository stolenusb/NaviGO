<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\RequestBody;
use ApiPlatform\OpenApi\Model\Response;
use App\Controller\AdminCityController;
use App\Repository\CityRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CityRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['city:read']],
    denormalizationContext: ['groups' => ['city:write']],
    operations: [
        new GetCollection(
            security: 'is_granted("PUBLIC_ACCESS")',
        ),
        new Get(
            security: 'is_granted("PUBLIC_ACCESS")',
        ),
        new Post(
            security: 'is_granted("ROLE_ADMIN")',
        ),
        new Patch(
            security: 'is_granted("ROLE_ADMIN")',
        ),
        new Delete(
            security: 'is_granted("ROLE_ADMIN")',
        ),

        // Custom Batch Creation Operation (Fully updated for API Platform v3)
        new Post(
            name: 'api_cities_batch',
            uriTemplate: '/cities/batch',
            controller: AdminCityController::class.'::batchCreate',
            security: 'is_granted("ROLE_ADMIN")',
            deserialize: false,
            validate: false,
            write: false,
            serialize: false,
            openapi: new Operation(
                summary: 'Batch create cities',
                description: 'Admin creates multiple cities at once. Accepts a simple array of city name strings.',
                requestBody: new RequestBody(
                    content: new \ArrayObject([
                        'application/json' => [
                            'schema' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'string',
                                    'example' => 'Casablanca',
                                ],
                            ],
                        ],
                    ])
                ),
                responses: [
                    '201' => new Response(
                        description: 'Cities processed successfully',
                        content: new \ArrayObject([
                            'application/json' => [
                                'schema' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'created' => [
                                            'type' => 'array',
                                            'items' => [
                                                'type' => 'object',
                                                'properties' => [
                                                    'name' => ['type' => 'string'],
                                                    '@id' => ['type' => 'string'],
                                                ],
                                            ],
                                        ],
                                        'errors' => [
                                            'type' => 'array',
                                            'items' => ['type' => 'string'],
                                        ],
                                    ],
                                ],
                            ],
                        ])
                    ),
                    '400' => new Response(
                        description: 'Invalid or empty JSON body context.'
                    ),
                ]
            )
        ),
    ]
)]
class City
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['city:read'])]
    private ?int $id = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    #[Groups(['city:read', 'city:write'])]
    private ?string $name = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }
}
