<p>Hi {{ $requester->name }},</p>

<p><strong>{{ $recipient->name }}</strong> accepted your friend request on {{ config('app.name') }}.</p>

<p>You can now use Watch Together and other social features together.</p>

<p>Friend ID: <strong>{{ $recipient->public_user_id }}</strong></p>

<p>Thanks,<br>{{ config('app.name') }}</p>

