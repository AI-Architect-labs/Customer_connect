# AgriConnect

AgriConnect is a production-oriented Progressive Web App for a local agricultural-products shop. Farmers can browse fertilizers, seeds, pesticides and farm supplies, add different products/quantities to a persistent cart, place Cash-on-Delivery orders, and securely view/cancel their own orders after phone OTP verification. The shop owner manages the storefront, categories, catalog, images, availability, orders, and basic sales analytics.

## Current stack

- **Next.js 16 App Router + React 19** — PWA/web application and route composition.
- **TypeScript strict mode** — domain/schema safety across UI, services and repositories.
- **Tailwind CSS 3.4 + Shadcn-compatible primitives** — accessible, lightweight mobile-first UI.
- **Firebase Authentication** — silent anonymous farmer identity, phone OTP linking, owner email/password.
- **Cloud Firestore** — shop, categories, products, orders and customer records.
- **Firebase Storage** — shop/product images.
- **Cloud Functions v2 + Admin SDK** — trusted price calculation, atomic order creation, lifecycle transitions, cancellation authorization, owner notifications, and abuse controls.
- **Firebase Cloud Messaging** — optional owner browser push notifications.
- **Firebase App Check** — optional client initialization now; must be enforced for production.
- **Zustand** — persistent cart state.
- **React Hook Form + Zod** — accessible forms and runtime validation.
- **Vitest + Firebase Rules Unit Testing** — business/schema/security tests.
- **GitHub Actions + Husky + lint-staged + Commitlint** — CI and contributor quality gates.

## One-command development setup

Prerequisites: **Node.js 20** (pinned by `.nvmrc`), **npm**, and **Python 3.10+**. **Java 21 is required only for Firebase Emulator Suite and Security Rules tests; it is not part of AgriConnect application development or its production runtime.**

```bash
npm run setup
```

`npm run setup` installs:

1. root JavaScript dependencies from `package.json`;
2. Cloud Functions dependencies from `functions/package.json`;
3. Python helper dependencies from `requirements.txt`.

The application is a TypeScript/Node project, so `package.json` is the canonical application dependency manifest. `requirements.txt` intentionally covers the Python Firebase Admin/bootstrap helpers; `scripts/setup.mjs` installs both ecosystems in one command.

Then:

```bash
cp .env.local.example .env.local
npm run emulators
```

In another terminal:

```bash
npm run dev
```

Open `http://localhost:3000` for the farmer storefront and `http://localhost:3000/login` for the owner login.

## First owner bootstrap

Owner mappings are **not writable from the browser**. This prevents a Firebase user from granting themselves owner access.

For a real Firebase project, set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account file stored **outside** the repository and run:

```bash
python scripts/bootstrap_owner.py \
  --project YOUR_FIREBASE_PROJECT_ID \
  --email owner@example.com \
  --password 'CHANGE_THIS_NOW' \
  --shop-id your-shop-id \
  --shop-name 'Your Agro Shop' \
  --owner-name 'Shop Owner' \
  --phone +919876543210 \
  --address 'Main Road, Your Village'
```

Set the same shop id in `.env.local`:

```env
NEXT_PUBLIC_DEFAULT_SHOP_ID=your-shop-id
```

## Main routes

Farmer:

- `/` — home/category entry.
- `/categories` — categories.
- `/category/[categoryId]` — products in category.
- `/product/[productId]` — product detail.
- `/search` — product/brand search.
- `/cart` — persistent cart.
- `/checkout` — COD checkout.
- `/orders` — phone-OTP-gated order history.
- `/about-shop` — shop identity/contact information.

Owner:

- `/login` — owner sign-in.
- `/owner/dashboard` — daily summary and stock alerts.
- `/owner/dashboard/analytics` — date-filtered sales analytics.
- `/owner/products` — product catalog management.
- `/owner/categories` — category management.
- `/owner/orders` — order queue/lifecycle management.
- `/owner/settings` — shop profile/settings.

The `/owner/*` prefix is an implementation correction to avoid URL collisions between farmer and owner route groups. See `docs/ImplementationSecurityAddendum.md`.

## Architecture rule

The intended dependency flow is:

```text
Route / UI
   ↓
Feature hook/component
   ↓
Feature service
   ↓
Repository / Firebase adapter
   ↓
Firebase
```

Trusted financial/order mutations go through Cloud Functions instead of direct client Firestore writes.

## Quality gates

```bash
npm run type-check
npm run lint
npm run format:check
npm test
npm run build
npm --prefix functions run build
npm run test:rules
```

`npm run test:rules` starts the local Auth, Firestore, and Storage emulators and requires Java 21. It does not access staging or production data.

Or, after dependencies are installed:

```bash
npm run verify
npm run verify:all
```

`npm run verify` is the fast app/functions quality gate. `npm run verify:all` adds the
Java-backed Firebase Security Rules tests and is required before a PR or release.

## Documentation

Start with:

- `AI_CONTEXT.md` — concise context for AI coding assistants and new maintainers.
- `PROJECT_STATE.md` — current implementation/verification state.
- `CONTRIBUTING.md` — development workflow.
- `SECURITY.md` — security invariants and reporting policy.
- `docs/PRD.md` — approved product requirements.
- `docs/Architecture.md` — approved technical architecture.
- `docs/Database.md` — approved Firestore data model.
- `docs/UI_UX.md` — approved UX specification.
- `docs/ImplementationSecurityAddendum.md` — implementation-time security/route refinements.
- `docs/Deployment.md` — production deployment checklist.

Every directory contains a local `README.md` describing its technology, responsibility, rationale, and contribution rules so a contributor can enter the codebase at any layer without guessing its purpose.

## Cost model

The app is designed to remain very inexpensive at local-shop scale. Firebase Auth/Firestore/Storage/FCM have free quotas, but this secure production architecture uses **Cloud Functions**, which requires Firebase's Blaze billing plan. Usage can remain inside no/very-low-cost quotas, but a strict guarantee of ₹0 cannot be made once billing is enabled. Configure budget alerts before production.

## License

Private project unless/until the repository owner chooses a license for public contributions.
