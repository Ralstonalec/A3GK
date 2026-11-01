# Pre-launch checklist

Every item is a `null`/empty value in `lib/content.ts` or a Shopify field, and shows as an amber marker until filled.

- [ ] Exact garment type (top / bottom / set) and product name
- [ ] What is included in each purchase; sold together or separately
- [ ] Front, back, side, padding close-up, fabric and worn photographs; short video
- [ ] Actual padding locations (`BASE_LAYER.paddedAreas`) and verified padding spec
- [ ] Fabric composition; care instructions; origin (only if verified)
- [ ] Sizes and measurement chart; body vs garment; how to measure; intended fit
- [ ] Colour options; price and currency; stock / preorder / made-to-order status (set in Shopify)
- [ ] Fulfilment, processing, production, transit and delivery estimates; separate shipments
- [ ] Returns / exchange terms
- [ ] Contact details; privacy policy; terms; genuine social links
- [ ] Replace hero material study with real product model/photography

## Pieces and combinations (Shopify setup)
Every piece is its own Shopify product so customers can buy any combination (one top, one bottom, both, or either):
`long-sleeve-top`, `short-sleeve-top`, `leggings`, `shorts` (plus `grip-socks`, `sports-bandages`).
- Give each of the four pieces a **Size** option (same option name on all) with its sizes and a price; set Active and available to the Online Store channel.
- The kit builder on `/products/padded-base-layer` adds the chosen top and bottom as separate cart lines, each with its own size. The old Shopify product with handle `padded-base-layer` is no longer used; archive it.
- Pricing is set: $50 CAD per piece, $80 CAD for one top plus one bottom. In Shopify each piece is priced 50.00 CAD and an automatic discount ("Top and bottom bundle ($80)", Tops × Bottoms, $20 off) is active. The site's displayed bundle saving uses `PRICING` in `lib/content.ts`; keep both in sync. Test a top + bottom checkout to confirm the discount applies, and set the products Active.
- Which pieces exist and their padding are in `PIECES` in `lib/content.ts`.

## Legal
See `docs/LEGAL-CHECKLIST.md` (privacy policy and terms pages exist; business details, returns/shipping facts and the club-list SQL are still to do).
