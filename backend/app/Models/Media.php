<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    /** @use HasFactory<\Database\Factories\MediaFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tmdb_id',
        'type',
        'is_saved',
        'is_liked',
        'is_disliked',
        'watched_at',
    ];

    protected $casts = [
        'is_saved' => 'boolean',
        'is_liked' => 'boolean',
        'is_disliked' => 'boolean',
        'watched_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
