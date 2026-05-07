<x-emails.layout subject="Friend request accepted" headline="Friend request accepted">
  <p style="margin:0 0 12px;">Hi {{ $requester->name }},</p>
  <p style="margin:0 0 12px;">
    <strong>{{ $recipient->name }}</strong> accepted your friend request on {{ config('app.name') }}.
  </p>
  <p style="margin:0 0 12px;">
    You can now use Watch Together and other social features together.
  </p>
  <p style="margin:0;">
    Friend ID: <strong>{{ $recipient->public_user_id }}</strong>
  </p>
</x-emails.layout>

