<?php

namespace App\Controller;

use App\Entity\City;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[AsController]
class AdminCityController extends AbstractController
{
    #[Route(
        path: '/api/cities/batch',
        name: 'api_cities_batch',
        methods: ['POST'],
    )]
    #[IsGranted('ROLE_ADMIN')]
    public function batchCreate(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || empty($data)) {
            return $this->json(['error' => 'Request body must be a non-empty array of city names.'], 400);
        }

        $created = [];
        $errors = [];

        foreach ($data as $index => $item) {
            // Support both string names and objects with "name" field
            $cityName = is_string($item) ? $item : ($item['name'] ?? null);

            if (!$cityName || !is_string($cityName) || trim($cityName) === '') {
                $errors[] = sprintf('Item #%d: Invalid city name.', $index);
                continue;
            }

            $cityName = trim($cityName);

            // Check for duplicates in the database
            $existing = $entityManager->getRepository(City::class)
                ->findOneBy(['name' => $cityName]);

            if ($existing) {
                $errors[] = sprintf('"%s" already exists.', $cityName);
                continue;
            }

            $city = new City();
            $city->setName($cityName);

            $violations = $validator->validate($city);
            if (count($violations) > 0) {
                $errors[] = sprintf('"%s": %s', $cityName, $violations[0]->getMessage());
                continue;
            }

            $entityManager->persist($city);
            $entityManager->flush();

            $created[] = [
                'name' => $city->getName(),
                '@id' => '/api/cities/' . $city->getId(),
            ];
        }

        $statusCode = empty($errors) ? 201 : (empty($created) ? 400 : 201);

        return $this->json([
            'created' => $created,
            'errors' => $errors,
        ], $statusCode);
    }
}