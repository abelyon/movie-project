<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FriendRequestReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $recipient,
        public User $requester,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New friend request',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.friend-request-received',
        );
    }
}

