# Legal checklist (Canada, small online store)

General information, not legal advice. Confirm the important items with an accountant or lawyer; rules differ by province.

## Done in the site
- [x] Privacy policy at `/privacy` (what is collected, why, service providers, rights, cookies, retention, children). Facts only the owner knows are amber "To confirm" markers.
- [x] Terms of sale at `/terms` (seller, prices in CAD, taxes and shipping at checkout, product information and renderings, wear note, accounts, liability, governing law).
- [x] Footer links to both; privacy link next to every email-consent checkbox (club form, sign-up).
- [x] Email consent is opt-in, unticked by default, with the time consent was given stored for members (CASL).
- [x] Sender identity placeholder on the club page and in the privacy policy (`BUSINESS` in `lib/content.ts`).
- [x] Unsubscribe page works for members and, once the SQL below is applied, for club-only sign-ups.
- [x] No advertising or analytics cookies, so no consent banner is needed today. If analytics or ads are added, add a consent banner first.
- [x] Card numbers never touch the site (hosted checkout).

## Waiting on the owner (fill in `BUSINESS` and `POLICIES` in `lib/content.ts`)
- [ ] Legal business name, mailing address, privacy contact email, governing law.
- [ ] Customer-service email, shipping times and costs, returns window and process.
- [ ] Retention periods and the age policy in the privacy policy.
- [ ] Name the checkout/payment provider and email provider in the privacy policy.
- [ ] Limits-of-liability wording in the terms: have a lawyer review.

## Needs a decision or approval before launch
- [ ] Apply `supabase/proposed/club-list-hardening.sql` (unique email, consent time, unsubscribe token). Required before the first marketing email.
- [ ] Every marketing email must contain: business name, mailing address, working unsubscribe link (`/unsubscribe?token=...`). Skip anyone with `unsubscribed_at` set.

## Business and tax (outside the site)
- [ ] Register the business (sole proprietorship or corporation) and your business name in your province.
- [ ] GST/HST: register once taxable sales pass $30,000 over four consecutive quarters (earlier if you want to claim input tax credits). Check provincial taxes (BC, SK, MB, QC).
- [ ] Separate business bank account and bookkeeping.
- [ ] If shipping to the US: state sales-tax thresholds, duties and delivery promises.
- [ ] Search CIPO for "A3GK" / "A3 Goalkeeping" and consider trademark registration.
- [ ] Insurance: general and product liability.

## Product and advertising
- [ ] Do not state fabric, padding spec or protection claims until the supplier has proven them (Competition Act).
- [ ] Textile labelling: fibre content, dealer name or CA number, care instructions, French/English where required.
- [ ] Check whether protective sports gear has safety requirements that affect what you may claim.
- [ ] Written supplier terms: lead times, returns, defects, product liability.
- [ ] Confirm you may use the supplier's photos; renderings must not mislead about the real product.

## Privacy operations
- [ ] Decide how deletion/access requests are handled (currently: by email or the contact form).
- [ ] Breach plan: report serious breaches to the Privacy Commissioner and notify affected people.
