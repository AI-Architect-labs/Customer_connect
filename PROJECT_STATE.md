# AgriConnect — Project State

**Last Updated:** 2026-09-03
**Current Phase:** V1 local verification complete; real Firebase staging setup pending
**Overall Status:** App, Functions, Firestore Rules, and Storage Rules pass locally; real environments remain unverified

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

Locally verified on the developer PC on 2026-09-02 under Node.js 20.20.2, npm 10.8.2, and OpenJDK 21.0.12.1:

- Reproducible dependency setup with `npm ci`, `npm --prefix functions ci`, and `python -m pip install -r requirements.txt`.
- TypeScript type-check, ESLint, Prettier, 5 unit tests, Cloud Functions build, Next.js production build, and `npm run verify`.
- All 5 Firestore Rules tests and all 4 Storage Rules tests pass against their emulators.
- Repository/file-structure and route validation, with no nested Git repository or conflicting Next.js routes.
- README coverage check: **every current source/project directory has README.md**.
- `.gitignore`, CI, Firebase rules/index/config, PWA assets and setup manifests are present.

The prior Storage HTTP 400 / `storage/unknown` failure was caused by running Firebase
Storage's browser transport in Vitest's global `jsdom` environment. The Rules suites
now explicitly use Vitest's Node environment; project `agriconnect-dev`, bucket
`agriconnect-dev.appspot.com`, ports, and production rules remain aligned and unchanged.

Dependency audit after targeted non-breaking upgrades: root has 8 moderate findings
and no high/critical findings; Functions has 12 moderate findings and no high/critical
findings. Remaining items are transitive Firebase CLI/Admin/Functions dependency-chain
advisories whose npm-proposed remediation is a breaking major downgrade; no forced
remediation was applied.

Still required before claiming staging or production readiness:

- Real Firebase dev/staging/prod projects and `.firebaserc` ids.
- Real owner bootstrap.
- Phone OTP test on a real browser/phone.
- Storage image upload test.
- FCM push test on a real Android browser/PWA.
- App Check staging validation then enforcement.
- Shop-owner acceptance test.

## 5. Current deployment blockers

1. Real Firebase projects have not been created/configured in this environment.
2. The Firebase project ids in `.firebaserc` have not been verified against accessible real projects.
3. Root and Functions dependency trees retain the moderate-only transitive findings documented above.
4. Real browser/device checks remain pending for phone OTP, Storage uploads, FCM, App Check and owner acceptance.
5. Cloud Functions require Blaze billing. The app is optimized for low usage/free quotas but cannot promise an absolute ₹0 bill after enabling billing.

## 6. Immediate next action

Perform Firebase staging setup only after reviewing the local verification result:

```bash
npm run verify
npm run verify:all
```

Local and emulator verification is complete. Functions-specific automated tests and
cross-service integration tests are still absent. Follow `docs/Deployment.md` from
staging through owner acceptance and production launch; staging and production have
not been verified.
