# 40ºMedia Portfolio

A static portfolio website for Harry — freelance video editor and broadcast director based in Sydney, Australia. Showcases film and video production work with dynamic filtering, individual work detail pages, and interactive animations.

## Features

- Portfolio grid with role-based filtering (Video Editor, Broadcast Director, Colourist, etc.)
- Individual work pages with embedded video, image galleries, credits, and testimonials
- Canvas particle animation, custom cursor, and scroll reveal effects
- Brutalist dark design with orange accent
- Data fetched from [Craft](https://www.craft.do/)'s API with client-side caching

## Tech Stack

Pure vanilla HTML, CSS, and JavaScript (ES modules) — no build tools or package manager required.

| Layer | Details |
|---|---|
| HTML/CSS/JS | Vanilla ES6+, CSS custom properties |
| Data | Craft Multi-Document API (REST) |
| Video | YouTube & Twitch embeds |
| Fonts | Google Fonts (Inter, Space Mono) |
| Hosting | Any static host (Vercel, Netlify, GitHub Pages) |

## Running Locally

Since this is a static site, you can open `index.html` directly in a browser. For best results (ES modules require a server), use a simple HTTP server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Caching

Portfolio data is cached in `localStorage` for 24 hours to reduce API calls. The cache key is `craft_works_cache`.

### Force resetting the cache

Append `?refresh_cache=true` to any page URL:

```
http://localhost:8000/?refresh_cache=true
```

The parameter is automatically removed from the URL after the cache is cleared and fresh data is fetched. This works on all pages (`index.html`, `works.html`, `work.html`).

Alternatively, you can clear the cache manually via browser DevTools:

1. Open DevTools (`F12`)
2. Go to **Application > Local Storage**
3. Delete the `craft_works_cache` entry
4. Reload the page

If the API is unreachable, the site will fall back to serving stale cached data automatically.

## Project Structure

```
portfolio/
├── index.html          # Home page
├── works.html          # Portfolio grid with filtering
├── work.html           # Individual work detail page
├── src/
│   ├── js/
│   │   ├── api.js      # Craft API integration + caching
│   │   ├── landing.js  # Home page logic
│   │   ├── works.js    # Works gallery logic
│   │   ├── work.js     # Work detail page logic
│   │   ├── particles.js# Canvas particle system
│   │   └── cursor.js   # Custom cursor
│   └── styles/
│       ├── main.css    # Global design system
│       ├── landing.css
│       ├── works.css
│       └── work.css
└── assets/
    └── images/
```

## Tools

Created with Google Antigravity and Claude Opus 4.5. Pulls data from Craft's API.
