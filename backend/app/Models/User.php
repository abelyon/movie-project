<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'public_user_id',
        'name',
        'email',
        'country_code',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (!$user->public_user_id) {
                $user->public_user_id = self::generatePublicUserId();
            }
        });
    }

    public static function generatePublicUserId(): string
    {
        do {
            $candidate = 'USR-'.strtoupper(bin2hex(random_bytes(3)));
        } while (self::query()->where('public_user_id', $candidate)->exists());

        return $candidate;
    }

    public function media()
    {
        return $this->hasMany(Media::class);
    }

    public function outgoingFriendRequests(): HasMany
    {
        return $this->hasMany(FriendRequest::class, 'requester_id');
    }

    public function incomingFriendRequests(): HasMany
    {
        return $this->hasMany(FriendRequest::class, 'recipient_id');
    }
}
