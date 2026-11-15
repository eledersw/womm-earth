WOMM Earth logo files
=====================

Colours: silver #C9D0D2 (dark mode), deep teal #0E2730 (light mode, icon tile).
Font: Stack Sans Headline Light (300), -0.02em tracking. Text is converted to outlines, so no font is needed.

LOGO (mark + "WOMM Earth")
  womm-earth-logo-dark-mode.svg     silver, for dark backgrounds
  womm-earth-logo-light-mode.svg    teal, for light backgrounds
  womm-earth-logo-currentcolor.svg  takes the CSS text colour (inline it in your HTML/JSX)

MARK (symbol only)
  womm-earth-mark-dark-mode.svg / -light-mode.svg / -currentcolor.svg

FAVICON AND APP ICONS
  favicon.svg           switches teal/silver with the browser's light/dark setting
  favicon.ico           16/32/48 fallback, teal tile
  apple-touch-icon.png  180x180
  icon-192.png, icon-512.png + site.webmanifest  (Android / installable app)

<head> tags
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">

Swapping the logo with your app's theme
  <picture>
    <source srcset="/womm-earth-logo-dark-mode.svg" media="(prefers-color-scheme: dark)">
    <img src="/womm-earth-logo-light-mode.svg" alt="WOMM Earth" height="40">
  </picture>
  If the app has its own theme toggle, inline womm-earth-logo-currentcolor.svg and set `color` in CSS instead.
