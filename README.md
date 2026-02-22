# Waterlight Studio Website

Static launch build for Waterlight Studio using an earthy visual system inspired by the Altaloma Squarespace template structure.

## Pages

- `/` Home
- `/about/` About
- `/gallery/` Gallery

## Stack

- Plain HTML/CSS/JS
- No framework or build step
- Cloudflare Pages compatible (root deploy)

## Local preview

Use any static server from the repo root, for example:

```bash
npx serve .
```

## Cloudflare Pages setup

1. Connect this GitHub repo to Cloudflare Pages.
2. Set `Production branch` to `main`.
3. Leave `Build command` empty.
4. Set `Build output directory` to `/`.
5. Add custom domains:
   - `waterlightstudio.com`
   - `www.waterlightstudio.com`

## Content replacement checklist

1. Replace placeholder images in `assets/img/placeholders/`.
2. Replace placeholder text in:
   - `index.html`
   - `about/index.html`
   - `gallery/index.html`
3. Set final email destination in `assets/js/main.js` (`SITE_CONFIG.contactEmail`).
4. Update page titles/descriptions for final SEO copy.

## Notes

- The gallery includes client-side category filters and a lightbox modal.
- Motion is subtle and disabled for `prefers-reduced-motion` users.
- No contact backend in v1; calls to action use `mailto:`.
