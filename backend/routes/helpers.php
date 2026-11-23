<?php
/**
 * Small helpers used by every route file. A route only does four things:
 * read the request, call a service, send the JSON answer, and leave all rules to the service.
 */

/** Sends {"success": true, "data": ..., "message": ...} with the given HTTP status (200 or 201). */
function respond(mixed $data, string $message, int $status = 200): void
{
    Flight::json(['success' => true, 'data' => $data, 'message' => $message], $status);
}

/** Sends {"success": false, "message": ..., "errors": {...}} and stops (jsonHalt makes sure the answer is really sent). */
function respondError(string $message, int $status, array $errors = []): void
{
    Flight::jsonHalt(['success' => false, 'message' => $message, 'errors' => (object) $errors], $status);
}

/** The JSON body of the request as an array. A missing, broken or non-object body is a 400 error. */
function jsonBody(): array
{
    $body = json_decode(Flight::request()->getBody(), true);
    if (!is_array($body) || array_is_list($body) && $body !== []) {
        throw ApiException::validation(['body' => 'the request body must be a JSON object']);
    }
    return $body;
}

/** A query-string value such as ?userId=3. Returns null when it is missing, throws a 400 error when it is not an id. */
function idQuery(string $name): ?int
{
    $value = Flight::request()->query[$name] ?? null;
    return $value === null || $value === '' ? null : Validator::id($value, $name);
}

/** A plain text query-string value such as ?search=moon, or null. */
function textQuery(string $name): ?string
{
    $value = Flight::request()->query[$name] ?? null;
    return is_string($value) && $value !== '' ? $value : null;
}
