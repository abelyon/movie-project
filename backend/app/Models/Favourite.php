<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favourite extends Model
{
    protected $fillable = ['user_id', 'media_type', 'tmdb_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
