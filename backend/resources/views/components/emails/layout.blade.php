<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ $subject ?? config('app.name') }}</title>
</head>
<body style="margin:0; padding:24px 12px; background-color:#0a0a0a; font-family:Arial, Helvetica, sans-serif; color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto;">
    <tr>
      <td style="padding-bottom:14px; text-align:center; color:#a3a3a3; font-size:12px; letter-spacing:0.08em; text-transform:uppercase;">
        {{ config('app.name') }}
      </td>
    </tr>
    <tr>
      <td style="background:#171717; border:1px solid #404040; border-radius:20px; padding:24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-bottom:16px; border-bottom:1px solid #404040;">
              <div style="font-size:20px; font-weight:700; color:#ffffff;">
                {{ $headline ?? config('app.name') }}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:18px; font-size:15px; line-height:1.65; color:#e5e5e5;">
              {{ $slot }}
            </td>
          </tr>
          @isset($actionText)
            <tr>
              <td style="padding-top:20px;">
                <a href="{{ $actionUrl }}" style="display:inline-block; background:#FDC700; color:#171717; text-decoration:none; font-weight:700; border-radius:12px; padding:12px 16px;">
                  {{ $actionText }}
                </a>
              </td>
            </tr>
          @endisset
          @isset($secondaryText)
            <tr>
              <td style="padding-top:18px; font-size:13px; line-height:1.6; color:#a3a3a3;">
                {!! $secondaryText !!}
              </td>
            </tr>
          @endisset
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding-top:12px; text-align:center; color:#737373; font-size:12px;">
        {{ config('app.name') }} &middot; Built for your watchlist
      </td>
    </tr>
  </table>
</body>
</html>
