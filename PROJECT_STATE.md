# AgriConnect — Project State

**Last Updated:** 2026-08-31
**Current Phase:** V1 implementation complete; dependency-backed verification and real Firebase staging setup pending
**Overall Status:** 🟡 Feature-complete codebase, not yet production-deployed

## 1. Source of truth

Read in this order when joining the project:

1. `AI_CONTEXT.md`
2. this file
3. `docs/PRD.md`
4. `docs/Architecture.md`
5. `docs/Database.md`
6. `docs/UI_UX.md`
7. `docs/ImplementationSecurityAddendum.md`
8. `docs/Deployment.md`

## 2. Implemented V1 capabilities

### Farmer

- Public/mobile-first home and owner-configured category browsing.
- Product cards/details, multiple images, brand/name search, pricing/discounts and availability states.
- Persistent Zustand cart with mixed products and varying quantities.
- Cash-on-Delivery checkout.
- Trusted Cloud Function order creation that recalculates prices from live product documents.
- Order confirmation without requiring a post-write order read.
- Phone OTP upgrade for order history and cancellation.
- Near-real-time order history/detail listeners after phone verification.
- Cancellation limited to `placed` orders through a trusted callable Function.
- About-the-Shop page and direct Call Shop action.
- Offline banner, PWA manifest/icons/service worker and contextual install control.

### Owner

- Email/password authentication and protected owner experience.
- Shop profile/settings and shop image upload.
- Configurable category create/edit/activate/deactivate.
- Product management with brand, category, description, pack/unit, pricing, availability, stock quantity and multiple images/cover image.
- Order queue/filtering.
- Order detail, quantity adjustment before confirmation, validated lifecycle transitions and cancellation.
- Dashboard summary, low-stock/out-of-stock alerts, best-seller/customer analytics and date-filtered sales view.
- Optional FCM browser notification opt-in for new orders.

### Platform/security

- Anonymous Firebase identity for guest sessions.
- Firestore and Storage explicit Security Rules.
- Owner mapping cannot be client-created; Admin bootstrap only.
- Direct client order/customer mutations are denied; trusted Functions own these writes.
- Server-side price validation and atomic order/customer transaction.
- Per-UID order rate limiting.
- App Check client integration with deploy-time Functions enforcement switch.
- GitHub Actions app/functions/rules CI jobs.
- Vitest unit tests and Firestore Rules tests.
- Setup/bootstrap/seed tooling.
- Every repository directory contains a local `README.md` describing its stack, responsibility and contributor rules.

## 3. Important implementation refinements

See `docs/ImplementationSecurityAddendum.md`. The most important are:

1. Owner management routes use `/owner/*` because Next.js route groups do not create URL segments and the original route sketch would collide with farmer routes.
2. `owners/{uid}` mappings are server/Admin provisioned rather than self-writable.
3. Order pricing and lifecycle writes moved from direct Firestore client writes to callable Functions.
4. Checkout customer prefill is restricted to the same persistent identity or a phone-verified identity instead of exposing an address to arbitrary phone-number guesses.

## 4. Dependency/verification status

Completed in the current build environment:

- Repository/file-structure validation.
- TypeScript/TSX parser pass over all source and function files: **0 syntax parse errors**.
- Route collision analysis: **0 conflicting Next.js routes** after `/owner/*` correction.
- README coverage check: **every current directory has README.md**.
- `.gitignore`, CI, Firebase rules/index/config, PWA assets and setup manifests are present.

Still required before claiming production readiness:

- `npm run setup` on a machine with npm registry access (this build environment could not complete npm downloads).
- Commit generated `package-lock.json` and `functions/package-lock.json` after successful installation.
- `npm run verify`.
- `npm run test:rules` with the downloadable Firestore emulator JAR.
- Real Firebase dev/staging/prod projects and `.firebaserc` ids.
- Real owner bootstrap.
- Phone OTP test on a real browser/phone.
- Storage image upload test.
- FCM push test on a real Android browser/PWA.
- App Check staging validation then enforcement.
- Shop-owner acceptance test.

## 5. Current deployment blockers

1. Real Firebase projects have not been created/configured in this environment.
2. `.firebaserc` still contains placeholder ids.
3. npm dependencies could not be downloaded in this execution environment, so the final semantic TypeScript/lint/Next build gates have not yet been run against the expanded V1 source.
4. Cloud Functions require Blaze billing. The app is optimized for low usage/free quotas but cannot promise an absolute ₹0 bill after enabling billing.

## 6. Immediate next action

On the developer PC:

```bash
npm run setup
cp .env.local.example .env.local
npm run verify
npm run emulators
npm run test:rules
```

Fix any dependency-version/type/lint issues surfaced by those real toolchains before creating the production Firebase projects. Then follow `docs/Deployment.md` from staging through owner acceptance and production launch.
