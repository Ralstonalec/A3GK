# Product photo originals

Full-size originals of the product photographs, kept here (not published) so crops can be remade.

- `padded-base-layer.webp`: the Padded Base Layer photo (1125×2000, portrait). Published as
  `public/images/products/padded-base-layer-1.webp` (used as-is on the product page, spotlight and cards) and cropped to 4:5
  as the Base layers tile, `public/images/categories/base-layers.webp`.

Image sizes are read from `data/products.json` (`width` / `height` per image, default 1200×1200), so portrait photos
display without distortion. `npm run assets` never overwrites an existing image unless you pass `--force`.
