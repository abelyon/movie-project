<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocialSignalUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public int $tmdbId,
        public string $mediaType,
        public string $action,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("users.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'social.signal.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'tmdb_id' => $this->tmdbId,
            'media_type' => $this->mediaType,
            'action' => $this->action,
        ];
    }
}
