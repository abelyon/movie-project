<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class JustWatchClient
{
    private const GRAPHQL_URL = 'https://apis.justwatch.com/graphql';

    private const CERTIFICATIONS_URL = 'https://apis.justwatch.com/content/age_certifications';

    /**
     * @return list<array{certification: string, meaning: string, order: int}>
     */
    public function certificationsForCountry(string $country, string $mediaType): array
    {
        $country = strtoupper(trim($country));
        if (strlen($country) !== 2) {
            return [];
        }

        $objectType = $mediaType === 'tv' ? 'show' : 'movie';
        $cacheKey = "justwatch:certs:{$country}:{$objectType}";

        return Cache::remember($cacheKey, now()->addDay(), function () use ($country, $objectType) {
            $response = Http::acceptJson()
                ->withHeaders(['User-Agent' => 'wachit/1.0'])
                ->get(self::CERTIFICATIONS_URL, [
                    'country' => $country,
                    'object_type' => $objectType,
                ]);

            if ($response->failed()) {
                return [];
            }

            $rows = $response->json();
            if (! is_array($rows)) {
                return [];
            }

            $entries = [];
            foreach ($rows as $index => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $name = trim((string) ($row['technical_name'] ?? ''));
                if ($name === '') {
                    continue;
                }
                $entries[] = [
                    'certification' => $name,
                    'meaning' => trim((string) ($row['description'] ?? '')),
                    'order' => (int) ($row['order'] ?? $index),
                ];
            }

            usort($entries, static fn (array $a, array $b): int => $a['order'] <=> $b['order'] ?: strcmp($a['certification'], $b['certification']));

            return $entries;
        });
    }

    public function ageCertificationForTmdbTitle(
        string $country,
        string $mediaType,
        int $tmdbId,
        string $title,
        ?string $alternateTitle = null,
    ): ?string {
        if ($tmdbId <= 0) {
            return null;
        }

        $country = strtoupper(trim($country));
        if (strlen($country) !== 2) {
            return null;
        }

        $objectType = $mediaType === 'tv' ? 'SHOW' : 'MOVIE';
        $cacheKey = "justwatch:age:{$country}:{$objectType}:{$tmdbId}";

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($country, $objectType, $tmdbId, $title, $alternateTitle) {
            foreach ($this->searchTitlesForQueries($country, $objectType, array_filter([
                trim($title),
                trim((string) $alternateTitle),
            ])) as $row) {
                if ((int) ($row['tmdbId'] ?? 0) !== $tmdbId) {
                    continue;
                }
                $cert = trim((string) ($row['ageCertification'] ?? ''));
                if ($cert !== '') {
                    return $cert;
                }
            }

            return null;
        });
    }

    /**
     * @param  list<string>  $queries
     * @return list<array{tmdbId: int, ageCertification: string}>
     */
    private function searchTitlesForQueries(string $country, string $objectType, array $queries): array
    {
        $language = $this->languageForCountry($country);
        $seen = [];
        $matches = [];

        foreach ($queries as $query) {
            if ($query === '') {
                continue;
            }

            $response = Http::acceptJson()
                ->withHeaders(['User-Agent' => 'wachit/1.0'])
                ->post(self::GRAPHQL_URL, [
                    'query' => <<<'GRAPHQL'
query SearchTitles($searchTitlesFilter: TitleFilter!, $country: Country!, $language: Language!, $first: Int!) {
  popularTitles(country: $country, filter: $searchTitlesFilter, first: $first) {
    edges {
      node {
        ... on MovieOrShow {
          content(country: $country, language: $language) {
            ageCertification
            externalIds {
              tmdbId
            }
          }
        }
      }
    }
  }
}
GRAPHQL,
                    'variables' => [
                        'country' => $country,
                        'language' => $language,
                        'first' => 8,
                        'searchTitlesFilter' => [
                            'searchQuery' => $query,
                            'objectTypes' => [$objectType],
                        ],
                    ],
                ]);

            if ($response->failed()) {
                continue;
            }

            $payload = $response->json();
            $edges = $payload['data']['popularTitles']['edges'] ?? [];
            if (! is_array($edges)) {
                continue;
            }

            foreach ($edges as $edge) {
                if (! is_array($edge)) {
                    continue;
                }
                $content = $edge['node']['content'] ?? null;
                if (! is_array($content)) {
                    continue;
                }
                $externalIds = $content['externalIds'] ?? null;
                $tmdbId = is_array($externalIds) ? (int) ($externalIds['tmdbId'] ?? 0) : 0;
                if ($tmdbId <= 0 || isset($seen[$tmdbId])) {
                    continue;
                }
                $seen[$tmdbId] = true;
                $matches[] = [
                    'tmdbId' => $tmdbId,
                    'ageCertification' => trim((string) ($content['ageCertification'] ?? '')),
                ];
            }
        }

        return $matches;
    }

    private function languageForCountry(string $country): string
    {
        return match (strtoupper($country)) {
            'AT', 'CH', 'DE' => 'de',
            'BE' => 'nl',
            'BR' => 'pt',
            'CA' => 'en',
            'CZ' => 'cs',
            'DK' => 'da',
            'ES', 'MX' => 'es',
            'FI' => 'fi',
            'FR' => 'fr',
            'GR' => 'el',
            'HU' => 'hu',
            'IT' => 'it',
            'JP' => 'ja',
            'KR' => 'ko',
            'NL' => 'nl',
            'NO' => 'no',
            'PL' => 'pl',
            'PT' => 'pt',
            'RO' => 'ro',
            'RU' => 'ru',
            'SE' => 'sv',
            'TR' => 'tr',
            default => 'en',
        };
    }
}
