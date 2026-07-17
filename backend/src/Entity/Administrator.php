<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;

#[ORM\Entity]
#[ApiResource(
    shortName: 'Administrator',
    description: 'Represents an administrator user profile. Accessible only by administrators.',
    operations: [
         new GetCollection(security: 'is_granted("ROLE_ADMIN")'),
         new Get(security: 'is_granted("ROLE_ADMIN")'),
         new Post(security: 'is_granted("ROLE_ADMIN")'),
         new Patch(security: 'is_granted("ROLE_ADMIN")'),
         new Delete(security: 'is_granted("ROLE_ADMIN")')
    ],
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']]
)]
class Administrator extends User
{
    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    protected ?string $firstName = null;

    #[Groups(['user:read', 'user:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 255)]
    #[ORM\Column(length: 255)]
    protected ?string $lastName = null;

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }
}
