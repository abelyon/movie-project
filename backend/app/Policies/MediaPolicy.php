<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

class MediaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Media $media): bool
    {
        return $media->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Media $media): bool
    {
        return $media->user_id === $user->id;
    }

    public function delete(User $user, Media $media): bool
    {
        return $media->user_id === $user->id;
    }

    public function restore(User $user, Media $media): bool
    {
        return $media->user_id === $user->id;
    }

    public function forceDelete(User $user, Media $media): bool
    {
        return $media->user_id === $user->id;
    }
}
