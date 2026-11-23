<?php
/**
 * Small checks shared by all services, so the same rule is not written six times.
 * Each method returns the cleaned value, or adds a message to $errors and returns null.
 * A service collects all problems first and then throws ApiException::validation($errors).
 */
class Validator
{
    /** A text between $min and $max characters (spaces at both ends are removed). */
    public static function text(array $data, string $field, int $min, int $max, array &$errors): ?string
    {
        $value = $data[$field] ?? null;
        if (!is_string($value)) {
            $errors[$field] = 'is required and must be text';
            return null;
        }
        $value = trim($value);
        $length = mb_strlen($value);
        if ($length < $min || $length > $max) {
            $errors[$field] = $min > 0 ? "must be $min to $max characters" : "must be at most $max characters";
            return null;
        }
        return $value;
    }

    /** Like text(), but the field may be missing or null (then null is returned without an error). */
    public static function optionalText(array $data, string $field, int $max, array &$errors): ?string
    {
        if (!isset($data[$field]) || $data[$field] === '') {
            return null;
        }
        return self::text($data, $field, 0, $max, $errors);
    }

    /** A whole number between $min and $max. Strings such as "3" are accepted, "3.5" or "abc" are not. */
    public static function whole(mixed $value, string $field, int $min, int $max, array &$errors): ?int
    {
        if (is_string($value) && preg_match('/^-?\d+$/', $value)) {
            $value = (int) $value;
        }
        if (!is_int($value) || $value < $min || $value > $max) {
            $errors[$field] = "must be a whole number from $min to $max";
            return null;
        }
        return $value;
    }

    /** One of the allowed words. */
    public static function oneOf(mixed $value, string $field, array $allowed, array &$errors): ?string
    {
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            $errors[$field] = 'must be one of: ' . implode(', ', $allowed);
            return null;
        }
        return $value;
    }

    /** A real calendar date written as YYYY-MM-DD. */
    public static function date(mixed $value, string $field, array &$errors): ?string
    {
        $date = is_string($value) ? DateTime::createFromFormat('!Y-m-d', $value) : false;
        if ($date === false || $date->format('Y-m-d') !== $value) {
            $errors[$field] = 'must be a real date written as YYYY-MM-DD';
            return null;
        }
        return $value;
    }

    /** An id from the URL or the query string. Throws a 400 error when it is not a positive whole number. */
    public static function id(mixed $value, string $field = 'id'): int
    {
        $errors = [];
        $id = self::whole($value, $field, 1, 4294967295, $errors);
        if ($id === null) {
            throw ApiException::validation($errors);
        }
        return $id;
    }

    /** Throws the 400 error when any problem was collected. */
    public static function throwIfAny(array $errors): void
    {
        if ($errors !== []) {
            throw ApiException::validation($errors);
        }
    }
}
