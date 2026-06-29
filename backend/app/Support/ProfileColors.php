<?php

namespace App\Support;

class ProfileColors
{
    /** @var list<string> */
    public const ALL = [
        'slate',
        'gray',
        'zinc',
        'neutral',
        'stone',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
    ];

    public const DEFAULT = 'neutral';

    public static function isValid(?string $color): bool
    {
        return $color === null || in_array($color, self::ALL, true);
    }
}
