# Brand assets

Your logo lives here once you install it:

```bash
npm run brand -- path/to/your-logo.svg
```

This copies the logo into `public/brand/`, records its size in `data/brand.json`, and regenerates the favicon,
app icons and social-share image from it. Then rebuild/redeploy.

**What to supply**

- A logo that reads on a **dark background** (the site is dark): a light or white version, ideally **SVG**
  (PNG/WebP with transparency also work). Max 2 MB. SVGs must not contain scripts.
- Optional `--mark path/to/square-symbol.svg` — a square symbol used for the app icons when the full logo is a wide wordmark.
- Optional `--name "Company name"` and `--bg "#ffffff"` (icon tile colour for dark logos).

`npm run brand -- --reset` goes back to the neutral text wordmark.

Until a logo is installed the header shows the plain text "A3GK" — a stand-in, not a logo.
