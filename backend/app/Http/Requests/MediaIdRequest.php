<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MediaIdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'tmdb_id' => ['required', 'integer', 'min:1'],
            'media_type' => ['required', Rule::in(['movie', 'tv'])],
        ];
    }
}
