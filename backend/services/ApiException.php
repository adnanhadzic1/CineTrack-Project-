<?php
/**
 * The one exception type that services throw for "expected" problems.
 * The route layer turns it into a JSON error response with the same HTTP status code.
 *
 *   400 validation   404 not found   409 conflict (duplicate)
 *   502 / 503 / 504  the external movie database failed
 */
class ApiException extends Exception
{
    private int $statusCode;
    private array $errors;

    public function __construct(string $message, int $statusCode, array $errors = [])
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errors = $errors;
    }

    public function getStatusCode(): int { return $this->statusCode; }

    /** Field-by-field messages, for example ['rating' => 'must be a whole number from 1 to 5']. */
    public function getErrors(): array { return $this->errors; }

    public static function validation(array $errors): self
    {
        return new self('Validation failed', 400, $errors);
    }

    public static function notFound(string $what): self
    {
        return new self("$what not found", 404);
    }

    public static function conflict(string $message): self
    {
        return new self($message, 409);
    }
}
