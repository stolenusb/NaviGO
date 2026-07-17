<?php

declare(strict_types=1);

namespace App\EventListener;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

/**
 * Catches unhandled exceptions and ensures the response always carries
 * the appropriate HTTP status code and a consistent JSON body.
 */
class KernelExceptionListener
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        $statusCode = 500;
        $message = 'Internal Server Error';

        if ($exception instanceof HttpExceptionInterface) {
            $statusCode = $exception->getStatusCode();
            $message = $exception->getMessage();
        } elseif ($exception instanceof AuthenticationException) {
            $statusCode = 401;
            $message = $exception->getMessage() ?: 'Full authentication is required to access this resource.';
        } elseif ($exception instanceof AccessDeniedException) {
            $statusCode = 403;
            $message = $exception->getMessage() ?: 'Access Denied.';
        }

        // Log the actual error for debugging
        $this->logger->error($exception->getMessage(), [
            'exception' => $exception,
            'statusCode' => $statusCode,
        ]);

        $event->setResponse(new JsonResponse(
            ['error' => $message],
            $statusCode
        ));
    }
}
