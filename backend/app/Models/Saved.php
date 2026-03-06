<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Saved extends Model
{
    protected $table = 'saved';

    protected $fillable = ['user_id', 'media_type', 'tmdb_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
