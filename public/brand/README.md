# Brand assets

`logo.png` and `lockup.png` here are your logo, converted for the dark site. Your originals are kept in
`/brand-source/` (black artwork on white). To install or replace the logo:

```bash
npm run brand -- brand-source/a3-mark-black.jpg --lockup brand-source/a3-sports-solutions-black.webp --knockout
```

This writes the converted files to `public/brand/`, records their size in `data/brand.json`, and regenerates
the favicon, app icons and social-share image. Then rebuild/redeploy.

**What each file is used for**

| Option | Used for |
| --- | --- |
| logo (first argument) | the header (about 40px tall) and the favicon / app icons. A compact symbol works best. |
| `--lockup full-logo.png` | optional full logo (symbol + name), shown larger in the footer and on the social-share image |
| `--mark square.png` | optional square symbol for the favicon / app icons, if different from the logo |
| `--knockout` | your artwork is dark on a light background (a black logo on white, JPEG is fine): convert it to white on transparent so it reads on the dark site |

Without `--knockout`, supply files that already read on a **dark background**: PNG/WebP with transparency, or SVG
(no scripts). JPEGs have no transparency and are refused unless `--knockout` is used. Max 2 MB per file.
Optional `--name "Company name"` and `--bg "#ffffff"` (icon tile colour for dark logos).

`npm run brand -- --reset` goes back to the neutral text wordmark (it does not touch `brand-source/`).
