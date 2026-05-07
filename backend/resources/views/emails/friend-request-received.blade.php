<x-emails.layout subject="New friend request" headline="New friend request">
  <p style="margin:0 0 12px;">Hi {{ $recipient->name }},</p>
  <p style="margin:0 0 12px;">
    <strong>{{ $requester->name }}</strong> sent you a friend request on {{ config('app.name') }}.
  </p>
  <p style="margin:0 0 12px;">
    Open the app and go to your Profile page to accept or deny it.
  </p>
  <p style="margin:0;">
    Requester ID: <strong>{{ $requester->public_user_id }}</strong>
  </p>
</x-emails.layout>

