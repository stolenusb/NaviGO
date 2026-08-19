<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Customer;
use App\Repository\CustomerRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
final class PartnerCustomerController extends AbstractController
{
    public function __construct(
        private readonly CustomerRepository $customerRepository,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $phone = trim($request->query->getString('phone'));
        if ('' === $phone) {
            return $this->json(['error' => 'A phone number is required.'], 400);
        }

        $customer = $this->customerRepository->findOneBy(['phone' => $phone]);
        if (!$customer instanceof Customer) {
            return $this->json(['error' => 'No customer was found with that phone number.'], 404);
        }

        return $this->json([
            '@id' => '/api/customers/'.$customer->getId(),
            'id' => $customer->getId(),
            'firstName' => $customer->getFirstName(),
            'lastName' => $customer->getLastName(),
            'phone' => $customer->getPhone(),
        ]);
    }
}
