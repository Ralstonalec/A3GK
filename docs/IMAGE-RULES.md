# Imagery rules for the padded base layer

Confirmed by the owner. Apply to every render, AI image, mock-up and 3D model.

1. **There is NO padding on the back.** The back of the top and leggings is plain, smooth fabric. Never render, draw or imply back, spine, shoulder-blade or rear-leg padding. Padded areas are only: chest, ribs, upper arms, elbows/forearms (top); hips/thighs and knees (leggings).
2. When prompting an image model, state it explicitly: "plain smooth back with no padding or pads on the back". Prefer front and side views; if a back view or a mid-dive shot where the back is visible is needed, check the result and reject it if any pad appears on the back.
3. AI-generated images must be labelled "Rendering" on the site. Real photographs are the proof; do not present renders as product photography.
4. Do not invent logos, text or specs. The only printed text on the product is the COMPRESSION waistband on the leggings.
5. **Worn under kit:** padding never shows through a jersey or shorts. Jersey fabric over the chest, ribs and upper arms is completely smooth. Padding is visible only where the base layer itself is exposed (sleeves below a short-sleeve jersey, legs below shorts). Match pad shapes exactly to the approved promo images.
6. **No generic AI faces.** Frame shots so no face is visible (crop at the neck/chin, or hands, arms and legs only) unless a real person's photo is used.

## Scenery renderings (no product)
Night-pitch scenes in `lib/photos.ts` (`SCENE`) are AI renderings used as backdrops. No people, no ball, no gloves, no logos or text. They sit behind sections via `SceneBackdrop`, are decorative (empty alt) and are called renderings wherever a caption is shown.

## Labelling
The owner asked for the "Rendering" pill overlays to be removed because they covered the photos. Images are still described as renderings in the small caption lines beneath them (hero, in-use gallery, short-sleeve set) and in alt text.
