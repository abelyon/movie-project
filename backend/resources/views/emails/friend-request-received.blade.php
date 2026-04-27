<p>Hi {{ $recipient->name }},</p>

<p><strong>{{ $requester->name }}</strong> sent you a friend request on {{ config('app.name') }}.</p>

<p>You can open the app and check your Profile page to accept or deny it.</p>

<p>Requester ID: <strong>{{ $requester->public_user_id }}</strong></p>

<p>Thanks,<br>{{ config('app.name') }}</p>

