@php
    $introLines = $introLines ?? [];
    $outroLines = $outroLines ?? [];
@endphp

<x-emails.layout :subject="$level === 'error' ? 'Action required' : (config('app.name').' notification')" :headline="config('app.name')"
    :actionText="$actionText ?? null"
    :actionUrl="$actionUrl ?? null"
>
  @foreach ($introLines as $line)
    <p style="margin:0 0 12px;">{{ $line }}</p>
  @endforeach

  @foreach ($outroLines as $line)
    <p style="margin:0 0 12px;">{{ $line }}</p>
  @endforeach

  @isset($salutation)
    <p style="margin:8px 0 0;">{{ $salutation }}</p>
  @else
    <p style="margin:8px 0 0;">Regards,<br>{{ config('app.name') }}</p>
  @endisset

  @isset($actionText)
    <x-slot:secondaryText>
      If you are having trouble clicking the "{{ $actionText }}" button, copy and paste this URL into your browser:<br>
      <a href="{{ $actionUrl }}" style="color:#6ee7b7;">{{ $actionUrl }}</a>
    </x-slot:secondaryText>
  @endisset
</x-emails.layout>
