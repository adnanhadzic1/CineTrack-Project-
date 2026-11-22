<?php
/** The database uses snake_case column names; the JSON API (and the frontend) use camelCase. */
class Format
{
    /** ['media_type' => 'tv'] becomes ['mediaType' => 'tv']. */
    public static function camel(array $row): array
    {
        $result = [];
        foreach ($row as $key => $value) {
            $camelKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $result[$camelKey] = $value;
        }
        return $result;
    }

    /** camel() for a list of rows. */
    public static function camelList(array $rows): array
    {
        return array_map([self::class, 'camel'], $rows);
    }
}
