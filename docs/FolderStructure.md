# Folder Structure Document

## AgriConnect — Production Codebase Organization (Version 1)

---

## Document Metadata

| Field             | Value                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Document Name** | FolderStructure.md                                                                                                      |
| **Version**       | 1.1                                                                                                                     |
| **Status**        | Approved                                                                                                                |
| **Last Updated**  | Phase 5 — Codebase Organization (examples/, src/config/, assets/fonts/, dependency diagram, implementation order added) |
| **Depends On**    | PRD.md (v1.2), Architecture.md (v1.1), Database.md (v1.1), UI_UX.md (v1.1) — all Approved                               |
| **Next Document** | Build & Sprint Plan (Phase 6 — to be determined)                                                                        |

---

## 1. Purpose and Scope

This document expands Architecture.md Section 3 ("Folder Structure") into the complete, implementation-ready organization of the AgriConnect codebase. It defines where every category of code, asset, and configuration lives, the conventions that keep the codebase consistent as it grows, and the boundaries that prevent the architectural principles established in Architecture.md (tenant isolation, layered identity, the service/repository pattern) from eroding as more engineers and features are added over time.

No application code is included in this document — only the structure, naming conventions, and organizational rules that future code will follow.

---

## 2. Complete Production Folder Structure

```
agriconnect/
├── src/
│   ├── app/                                  # Next.js App Router — routes only
│   │   ├── (farmer)/                         # Farmer route group (guest experience)
│   │   ├── (owner)/                          # Owner route group (authenticated)
│   │   ├── api/                              # Route handlers, if/when needed (none required for V1)
│   │   ├── layout.tsx                        # Root layout, global providers
│   │   ├── globals.css                       # Tailwind base + design token CSS variables
│   │   └── manifest.ts                       # PWA manifest definition
│   │
│   ├── features/                             # Feature-first business logic modules
│   │   ├── catalog/                          # Products + categories (farmer + owner)
│   │   ├── cart/                             # Cart state and logic
│   │   ├── checkout/                         # Checkout flow logic
│   │   ├── orders/                           # Order lifecycle (farmer + owner)
│   │   ├── customers/                        # Customer prefill logic
│   │   ├── shop-profile/                     # Shop info / About-the-Shop / settings
│   │   ├── auth/                             # Anonymous / phone-linked / owner auth
│   │   └── analytics/                        # Owner sales analytics
│   │
│   ├── components/
│   │   ├── ui/                               # Shadcn primitives (design-system-level, no business logic)
│   │   └── shared/                           # Cross-feature composed components (Section 7, UI_UX.md)
│   │
│   ├── lib/
│   │   ├── firebase/                         # Firebase SDK initialization and low-level wrappers
│   │   ├── repositories/                     # Typed Firestore/Storage access (Architecture.md §2.5)
│   │   └── utils/                            # Generic, feature-agnostic helper functions
│   │
│   ├── hooks/                                # Cross-feature shared hooks only (feature-specific hooks live inside their feature)
│   ├── store/                                # Zustand stores (cart, UI state)
│   ├── types/                                # Shared TypeScript types/interfaces
│   ├── schemas/                              # Zod validation schemas
│   ├── constants/                            # Shared enums (Database.md §12), feature flags
│   ├── config/                               # Application configuration (Section 2.1)
│   ├── i18n/                                 # Translation keys (English now, Telugu-ready)
│   └── styles/                               # Design tokens as CSS/Tailwind theme extensions (UI_UX.md §17)
│
├── functions/                                # Cloud Functions (separate deploy target, separate package)
│   ├── src/
│   │   ├── triggers/                         # Firestore-triggered functions
│   │   ├── shared/                           # Code shared across functions (types, constants mirrored from src/)
│   │   └── index.ts                          # Function exports
│   ├── package.json
│   └── tsconfig.json
│
├── public/                                   # Static assets served as-is
│   ├── icons/                                # PWA icon set
│   ├── images/                               # Static illustrations (empty states, onboarding)
│   ├── assets/
│   │   └── fonts/                            # Self-hosted web fonts, including future Telugu-compatible fonts (Section 2.2)
│   └── sw.js                                 # Generated service worker (build output, not hand-written)
│
├── examples/                                  # Sample/seed data for local development and demos (Section 2.3)
│   ├── seed-data/
│   │   ├── shop.sample.json
│   │   ├── categories.sample.json
│   │   ├── products.sample.json
│   │   └── orders.sample.json
│   └── README.md
│
├── tests/                                    # Test suites (see Section 12)
│   ├── unit/
│   ├── integration/
│   ├── rules/                                # Firestore/Storage Security Rules emulator tests
│   └── e2e/
│
├── docs/                                     # Project documentation (see Section 13)
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Database.md
│   ├── UI_UX.md
│   ├── FolderStructure.md
│   └── adr/                                  # Standalone ADR files, if the summary in Architecture.md grows large
│
├── scripts/                                  # One-off/maintenance scripts (e.g., future backfill migrations)
│
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── .firebaserc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .github/
    └── workflows/                            # CI/CD pipeline definitions (Architecture.md §10.2)
```

### 2.1 `src/config/` — Application Configuration

Distinct in purpose from `src/constants/` (Section 10.5), which holds shared domain enums and fixed business values: `src/config/` holds **environment- and deployment-aware configuration** — values that legitimately differ between `agriconnect-dev`, `agriconnect-staging`, and `agriconnect-prod` (Architecture.md Section 10.3), such as Firebase project configuration references, feature-flag defaults per environment, and any tunable runtime settings (e.g., pagination page size, cache durations). Firebase API keys/config themselves are read from environment variables at build time; `src/config/` is where those environment variables are validated, typed, and exposed to the rest of the app as a single typed config object, rather than `process.env` being accessed ad hoc throughout the codebase.

### 2.2 `public/assets/fonts/` — Self-Hosted Fonts

Reserved for future self-hosted web font files. V1 ships with the system font stack (UI_UX.md Section 8.1), so this directory is empty at launch — but it is established now, rather than added later, specifically to hold the Telugu-compatible font file(s) that UI_UX.md Section 14 flags as a pre-requisite check before a Telugu localization rollout. Placing it under `public/assets/` (rather than bundling fonts through the JS build pipeline) keeps font loading simple, cacheable, and independent of application code changes.

### 2.3 `examples/` — Sample Data and Seed Files

Contains sample/seed JSON data shaped exactly according to the schemas defined in Database.md Section 3 — a sample shop, a handful of categories, products (including multi-image and both-availability-status examples), and orders across different lifecycle statuses. This exists to support:

- **Local development:** seeding the Firebase emulator (Database.md Section 7.4) with realistic data without needing a real shop's data or manual re-entry every time the emulator resets.
- **Demos and stakeholder review:** giving the shop owner (or any reviewer) something realistic to look at before the real catalog is entered.
- **Test fixtures:** the `tests/integration/` and `tests/e2e/` suites (Section 12) reference this same seed data, so test scenarios and manual/demo scenarios stay consistent with each other rather than drifting into two different "sample datasets."

This folder contains only static data files and a short `README.md` explaining how to load them into the emulator — never executable seeding logic itself (that belongs in `scripts/`, which reads from `examples/seed-data/` as its data source).

---

## 3. Feature-First Organization

The single most important organizational decision in this codebase is that **business logic is organized by feature, not by technical layer.** Rather than one giant `components/` folder and one giant `hooks/` folder containing every screen's logic mixed together, each feature (`catalog`, `cart`, `checkout`, `orders`, `customers`, `shop-profile`, `auth`, `analytics`) owns its own internal slice of components, hooks, and service calls.

### 3.1 Standard Feature Folder Shape

Every folder under `src/features/` follows the same internal shape, so a developer who understands one feature's layout already understands all of them:

```
features/orders/
├── components/          # Components specific to the orders feature only
│   ├── farmer/           # Farmer-facing order components (OrderHistoryList, OrderStatusStepper)
│   └── owner/             # Owner-facing order components (OrderQueueTable, OrderDetailPanel)
├── hooks/                # useOrderStatus, useOwnerOrderQueue, useOrderHistory
├── services/              # orderService.ts (Architecture.md §2.4)
├── types.ts               # Order, OrderItem, OrderStatus — feature-local types
├── schema.ts               # Zod schema for order creation/validation (Database.md §5.3–5.4)
└── index.ts                # Public exports — the only file other features are allowed to import from
```

### 3.2 Rationale

- **Discoverability:** anything related to "orders" — UI, data access, validation, hooks — lives in one place, rather than requiring a developer to hunt across `components/`, `hooks/`, and `lib/services/` separately for every piece of one feature.
- **Safer changes:** modifying the order lifecycle touches one feature folder, not a dozen scattered files, reducing the chance of an incomplete change.
- **Enforceable boundaries:** because each feature exposes only an `index.ts`, it becomes straightforward (and lintable, see Section 11) to prevent one feature from reaching into another feature's internals.
- **Scales naturally with the product.** Architecture.md's future-extensibility items (Section 9/12 of that document) — AI recommendations, WhatsApp notifications, payments — each become a new feature folder (`ai-recommendations/`, `notifications/`, `payments/`) added alongside the existing ones, rather than requiring existing folders to be reorganized.

---

## 4. Route Organization

Routing lives exclusively in `src/app/`, and **contains no business logic of its own** — every route file is a thin composition of feature components, hooks, and layout.

```
app/
├── (farmer)/
│   ├── layout.tsx                  # Farmer shell: bottom tab bar, farmer-only providers
│   ├── page.tsx                    # F1 — Home
│   ├── category/[categoryId]/page.tsx     # F2 — Category Listing
│   ├── product/[productId]/page.tsx       # F3 — Product Detail
│   ├── search/page.tsx             # F4 — Search Results
│   ├── cart/page.tsx                # F5 — Cart
│   ├── checkout/page.tsx            # F6 — Checkout
│   ├── checkout/confirmation/page.tsx     # F7 — Order Confirmation
│   ├── orders/page.tsx              # F8/F10 — My Orders (phone entry + history, state-driven within one route)
│   ├── orders/[orderId]/page.tsx    # F11 — Order Detail / Status
│   └── about-shop/page.tsx           # F12 — About the Shop
│
├── (owner)/
│   ├── layout.tsx                    # Owner shell: sidebar/bottom-tabs, auth guard
│   ├── login/page.tsx                 # O1 — Login
│   ├── dashboard/page.tsx              # O2 — Dashboard
│   ├── dashboard/analytics/page.tsx    # O3 — Sales Analytics
│   ├── products/page.tsx                # O4 — Product List
│   ├── products/new/page.tsx             # O5 — Add Product
│   ├── products/[productId]/edit/page.tsx # O5 — Edit Product
│   ├── categories/page.tsx                # O6 — Category List
│   ├── categories/new/page.tsx             # O7 — Add Category
│   ├── categories/[categoryId]/edit/page.tsx # O7 — Edit Category
│   ├── orders/page.tsx                     # O8 — Order Queue
│   ├── orders/[orderId]/page.tsx            # O9 — Order Detail (Owner View)
│   └── settings/page.tsx                     # O10 — Shop Settings
│
├── layout.tsx                         # Root layout (fonts, global providers, theme)
├── globals.css
└── manifest.ts
```

### 4.1 Route-to-Feature Mapping Rule

Every route file imports its screen content from the corresponding feature folder (Section 3) — e.g., `app/(farmer)/cart/page.tsx` renders `<CartScreen />` imported from `features/cart`. A route file should never itself contain the substantial JSX, data fetching, or business logic for a screen; if it does, that logic has been placed in the wrong layer and should be moved into the feature.

### 4.2 Route Groups and Layout Isolation

The `(farmer)` and `(owner)` route groups (parentheses signal a Next.js route group, contributing no URL segment) exist specifically so each can have its own root layout, navigation shell, and auth-guarding behavior without any conditional branching — a farmer never downloads owner-shell code, and vice versa, consistent with Architecture.md Section 2.1's design intent.

---

## 5. Component Organization

Three tiers, from most generic to most specific, matching the layering already established in UI_UX.md Section 7:

| Tier                                | Location                         | Contains                                                                                            | Example                                                                                                                                                                              |
| ----------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Design-system primitives**        | `components/ui/`                 | Unmodified or lightly themed Shadcn components; no business logic, no feature awareness             | `Button`, `Dialog`, `Input`, `Badge`                                                                                                                                                 |
| **Shared cross-feature components** | `components/shared/`             | Composed components used by two or more features, still free of any single feature's business logic | `ProductCard`, `AvailabilityBadge`, `ImageCarousel`, `PriceTag`, `CallShopButton`, `StatusStepper`, `StatusPill`, `QuantityStepper`, `EmptyState`, `SkeletonCard`, `InlineFormError` |
| **Feature-specific components**     | `features/{feature}/components/` | Components that only make sense within one feature's context                                        | `OrderQueueTable` (orders), `ProductForm` (catalog), `CheckoutAddressForm` (checkout)                                                                                                |

### 5.1 Placement Rule

A component starts in its feature's `components/` folder by default. It is only promoted to `components/shared/` once a second feature genuinely needs it — premature promotion to "shared" for a component only one feature currently uses adds indirection without benefit, and risks guessing wrong about the abstraction a future second use case will actually need.

### 5.2 Farmer/Owner Sub-splitting Within a Feature

Where a feature serves both experiences (e.g., `orders`, which has both farmer-facing and owner-facing screens), its `components/` folder is further split into `farmer/` and `owner/` subfolders (Section 3.1), mirroring the same separation already established at the route level (Section 4), so the same organizational logic is consistent whether you're looking at routes or components.

---

## 6. Shared UI Library

`components/ui/` is treated as a **stable, slow-changing foundation layer** rather than a place for feature iteration:

- Contains only Shadcn-based primitives, themed via the design tokens defined in UI_UX.md Section 17 (colors, typography, spacing, radius, shadow) — these tokens are implemented here as Tailwind theme extensions / CSS custom properties, and nowhere else, so there is exactly one place a future rebrand or theme adjustment needs to touch.
- Components here never import from `features/` — the dependency direction is strictly one-way (`features` depends on `components/ui`, never the reverse), enforced per Section 11.
- New primitives are added here only when a genuinely new, feature-agnostic UI pattern emerges (e.g., a new kind of form control) — not as a dumping ground for anything visual.

---

## 7. Services Layer

Per Architecture.md Section 2.4, the service layer is the sole interface between UI/hooks and Firestore/Storage. In this folder structure, each feature owns its own service file(s), living inside that feature's folder rather than in one giant shared `services/` directory:

```
features/catalog/services/productService.ts
features/catalog/services/categoryService.ts
features/orders/services/orderService.ts
features/customers/services/customerService.ts
features/shop-profile/services/shopService.ts
features/analytics/services/analyticsService.ts
```

### 7.1 Responsibilities

- Expose intention-revealing functions (`listActiveProducts`, `createOrder`, `updateOrderStatus`) — never a raw Firestore query object leaked back to a hook or component.
- Perform the client-side validation pass (Database.md Section 5) using the Zod schemas in `src/schemas/` before attempting any write.
- Compose one or more repository calls (Section 8) — a service function may call multiple repositories (e.g., `orderService.createOrder` calls both the `orders` and `customers` repositories within a single batched write, per Database.md Section 8's atomicity note).

### 7.2 What Does Not Belong Here

Services never contain JSX, never import React hooks, and are never called directly by a route file — they are called exclusively from within a feature's own hooks (Section 9), keeping data-fetching orchestration (loading states, re-fetching, listener subscriptions) cleanly separated from raw data access.

---

## 8. Repository Layer

`lib/repositories/` contains the thin, typed Firestore/Storage access layer described in Architecture.md Section 2.5 — one repository module per Firestore collection, mirroring Database.md Section 2's collection list exactly:

```
lib/repositories/
├── shopRepository.ts
├── categoryRepository.ts
├── productRepository.ts
├── orderRepository.ts
├── customerRepository.ts
└── ownerRepository.ts
```

### 8.1 Responsibilities

- Apply Firestore's typed converters (mapping raw documents to/from the TypeScript interfaces in `src/types/`) so every read/write is type-checked against the exact schema defined in Database.md Section 3.
- Compose query constraints (`where`, `orderBy`, `startAfter` for pagination per Architecture.md Section 9) but contain no business validation logic — that belongs one layer up, in services (Section 7).
- This is a deliberately thin layer: if a function here starts containing conditional business rules (e.g., "only allow this write if X"), that logic has crept into the wrong layer and belongs in the corresponding service instead.

### 8.2 Why Repositories Are Separate From Services

Keeping repositories thin and services one layer above them means a repository can be unit-tested against the Firebase emulator purely for "does this function read/write the right shape of data," while a service can be tested for "does this function correctly enforce business rules" — two different concerns, two different (and independently useful) categories of test (Section 12).

---

## 9. Firebase Layer

`lib/firebase/` is the **only place the raw Firebase SDK is imported anywhere in `src/`** — this is a hard boundary (Section 11), not just a convention:

```
lib/firebase/
├── client.ts        # Firebase app initialization (config, singleton instance)
├── auth.ts           # Anonymous sign-in, phone OTP flow, credential linking, owner email/password
├── firestore.ts       # Firestore instance getter + shared converter factory
└── storage.ts          # Upload/read helpers for Storage
```

Repositories (Section 8) import from here; nothing else in `src/` does. This is what makes the repository layer a genuine seam — if the project ever needed to swap Firestore for another database, or add a server-side API layer, only `lib/firebase/` and `lib/repositories/` would need to change; every feature, hook, and component built on top of `orderService.createOrder()` and its siblings would be entirely unaffected.

---

## 10. Hooks, State Management, Types, and Validation Schemas

### 10.1 Hooks

- **Feature-specific hooks** (the majority) live inside their owning feature: `features/orders/hooks/useOrderStatus.ts`, `features/catalog/hooks/useProducts.ts`, etc.
- **`src/hooks/`** (top-level) is reserved for genuinely cross-feature hooks with no natural single owner — e.g., `useOnlineStatus` (offline detection, UI_UX.md Section 12) or `useDebounce` (a generic utility hook used by both catalog search and owner product-list filtering).
- Hooks are the layer that combines a service call with React state (loading/error/data), so components consume `const { products, loading } = useProducts(categoryId)` rather than orchestrating Firestore listeners themselves (Architecture.md Section 2.4/6.3).

### 10.2 State Management (`src/store/`)

Per Architecture.md Section 6, kept deliberately minimal:

```
store/
├── cartStore.ts       # Zustand cart store (Section 6.4 of Architecture.md)
└── uiStore.ts          # Small transient cross-component UI flags, if/when genuinely needed
```

No feature owns its own Zustand store beyond these two — server-derived state (products, orders) is deliberately _not_ placed here, since Firestore listeners (via feature hooks) already serve that role (Architecture.md Section 6.3), and a duplicate store would risk becoming a second, driftable source of truth.

### 10.3 Types (`src/types/`)

Shared, cross-feature TypeScript interfaces, mirroring Database.md Section 3 exactly:

```
types/
├── shop.ts
├── category.ts
├── product.ts
├── order.ts
├── customer.ts
├── owner.ts
└── common.ts        # Shared primitives: NormalizedPhone, FirestoreTimestamp alias, etc.
```

A feature-local type that has no reuse value outside its own feature (e.g., a form's internal draft-state shape) stays inside that feature's own `types.ts` (Section 3.1) rather than being placed here — `src/types/` is reserved for the types that mirror the actual Firestore schema and are genuinely shared.

### 10.4 Validation Schemas (`src/schemas/`)

Zod schemas mirroring Database.md Section 5's validation rules and Section 12's shared enums exactly:

```
schemas/
├── productSchema.ts
├── categorySchema.ts
├── orderSchema.ts
├── customerSchema.ts
└── shopSchema.ts
```

Each schema is built from the shared enum constants (Section 10.5) rather than re-declaring literal string unions locally, so a `unit` or `availabilityStatus` value only ever has one canonical definition in the entire codebase (Database.md Section 12's implementation guidance).

### 10.5 Shared Enums (`src/constants/`)

```
constants/
├── enums.ts           # ProductUnit, AvailabilityStatus, OrderStatus, OwnerRole (Database.md §12)
├── featureFlags.ts     # Any future feature-flag toggles
└── config.ts            # Non-secret app-wide constants (e.g., OTP resend cooldown duration)
```

This is the single canonical source that `types/`, `schemas/`, and (by documented, manually-kept-in-sync reference, since rules can't import code) `firestore.rules` all trace back to, per Database.md Section 12.

---

## 11. Module Boundaries and Dependency Rules

These rules are enforceable via lint configuration (e.g., an import-boundary ESLint rule) and should be treated as build-breaking violations, not stylistic suggestions:

### 11.0 Simplified Dependency Flow

At its simplest, the entire codebase's dependency direction reduces to one straight line:

```
   UI (components / app routes)
        │
        ▼
     Feature
        │
        ▼
     Service
        │
        ▼
   Repository
        │
        ▼
    Firebase
```

Data and calls only ever flow **downward** through this chain. The following reverse dependencies are explicitly forbidden, in addition to the detailed rules in Section 11.1:

- ❌ **Firebase → Repository, Service, Feature, or UI** — the Firebase layer (`lib/firebase/`) must never import from or know about any layer above it.
- ❌ **Repository → Service, Feature, or UI** — a repository must never call a service, import a feature's hook, or reference any component.
- ❌ **Service → Feature (a different feature) or UI** — a service may be called by its own feature's hooks, but must never import a component or reach into another feature.
- ❌ **Feature → UI-only concerns bypassing its own Service/Repository** — a feature's components must not query Firestore directly, skipping the Service/Repository layers beneath it.
- ❌ **Any layer → a layer above it, skipping intermediate layers** — e.g., a component calling a repository function directly, bypassing the service layer's validation pass (Section 7.1), is forbidden even though it might "work" technically.

If a change seems to require a reverse or skip-layer dependency, that is a signal the responsibility has been placed in the wrong layer — the fix is to move the logic to its correct layer, not to add an exception to this diagram.

### 11.1 Allowed Dependency Directions

```
app/  -->  features/  -->  components/shared/  -->  components/ui/
                  |
            lib/services (feature-owned)
                  |
            lib/repositories/
                  |
            lib/firebase/
```

_(feature-owned services live inside each feature folder per Section 7, but conceptually sit at this layer of the dependency chain)_

- `app/` may import from `features/`, `components/shared/`, and `components/ui/`, but never directly from `lib/repositories/` or `lib/firebase/` — a route must go through a feature's hook, never around it.
- `features/` may import from `components/shared/`, `components/ui/`, `lib/repositories/`, `lib/firebase/`, `types/`, `schemas/`, `constants/`, and `store/` — but **one feature may never import another feature's internals** (i.e., `features/checkout` cannot reach into `features/cart/components/...` directly). If checkout needs something from cart, cart must export it from its `index.ts` (Section 3.1), and checkout imports from that public surface only.
- `components/shared/` may import from `components/ui/` and `types/`, but never from `features/` or `lib/repositories/` — shared components must remain feature-agnostic and receive all data via props.
- `components/ui/` imports from nothing else in `src/` except design tokens (`styles/`) — it is the true foundation layer.
- `lib/repositories/` may import from `lib/firebase/` and `types/` only.
- `lib/firebase/` imports from nothing else in `src/` — it is the boundary to the outside world (the Firebase SDK itself).

### 11.2 Why This Matters

Without enforced boundaries, a codebase built by more than one person over time tends to accumulate shortcuts — a component reaching directly into Firestore "just this once," or one feature quietly depending on another's internal component. Each shortcut is individually small, but collectively they erode exactly the seams (service layer, repository layer, feature isolation) that Architecture.md identified as the ones expensive to unwind later. Enforcing these boundaries at lint-time, from the first commit, is far cheaper than a future refactor to reintroduce them.

### 11.3 The `functions/` Boundary

`functions/` is a **separate deployable package** with its own `package.json` and dependency tree — it does not import from `src/` directly (Next.js client code and Cloud Functions have different runtime environments and bundling concerns). Where genuinely identical logic is needed in both (e.g., the shared enums in Section 10.5), it is duplicated deliberately in `functions/src/shared/` with a code comment cross-referencing `src/constants/enums.ts` as the source of truth — the same documented-but-not-technically-shared pattern already established for Firestore Rules in Database.md Section 12.

---

## 12. Testing Folders

```
tests/
├── unit/                    # Pure logic: service validation functions, utility functions, Zod schemas
│   ├── services/
│   └── utils/
├── integration/              # Repository-level tests against the Firebase emulator (Firestore/Storage)
│   └── repositories/
├── rules/                     # Firestore/Storage Security Rules tests (Database.md §7.4)
│   ├── firestore.rules.test.ts
│   └── storage.rules.test.ts
└── e2e/                        # End-to-end flows against a running emulator + app instance
    ├── farmer-checkout.spec.ts
    └── owner-order-management.spec.ts
```

### 12.1 Mapping Tests to Architecture Layers

- **Unit tests** target `lib/repositories/` business-validation logic that lives in feature `services/`, and `schemas/` — fast, no emulator required.
- **Integration tests** target `lib/repositories/` directly against the Firestore/Storage emulator, verifying the typed converters and query composition behave as specified in Database.md Section 3/6.
- **Rules tests** are the mandatory gate described in Database.md Section 7.4 — every access pattern in Database.md Section 7.2/7.3 has both a "should succeed" and "should fail" test case.
- **E2E tests** cover the critical user journeys from PRD.md Section 6 (Journey A through F) end-to-end, against the emulator suite, catching integration issues that unit/integration tests in isolation would miss.

### 12.2 Test File Placement Convention

Tests live in the centralized `tests/` directory rather than co-located next to source files (e.g., no `productService.test.ts` sitting beside `productService.ts`) — chosen for this project specifically so that the `rules/` and `e2e/` categories (which don't map to any single source file) have a natural home alongside `unit/` and `integration/`, keeping all test categories discoverable in one place rather than split between co-located and centralized conventions.

---

## 13. Documentation Folders

```
docs/
├── PRD.md
├── Architecture.md
├── Database.md
├── UI_UX.md
├── FolderStructure.md
└── adr/                        # Reserved for future standalone ADR files
    └── (empty in V1 — ADRs currently consolidated in Architecture.md's Appendix)
```

All five phase documents produced so far live together in `docs/`, version-controlled alongside the code they describe — so a future engineer can always find the design rationale for any part of the system without leaving the repository. The `adr/` subfolder is reserved but empty in V1; if the ADR Summary appendix in Architecture.md grows unwieldy as more decisions accumulate over time, individual ADRs can be split out into their own numbered files here (e.g., `adr/011-payment-integration.md`) without disrupting the existing summary.

---

## 14. Naming Conventions

| Category                       | Convention                                                                                    | Example                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| React component files          | PascalCase, matching the exported component name                                              | `ProductCard.tsx`, `OrderStatusStepper.tsx`         |
| Hooks                          | camelCase, prefixed `use`                                                                     | `useProducts.ts`, `useOrderStatus.ts`               |
| Services                       | camelCase, suffixed `Service`                                                                 | `productService.ts`, `orderService.ts`              |
| Repositories                   | camelCase, suffixed `Repository`                                                              | `productRepository.ts`                              |
| Zod schemas                    | camelCase, suffixed `Schema`                                                                  | `productSchema.ts`                                  |
| Types/interfaces               | PascalCase, no file-name suffix needed since the folder (`types/`) is already unambiguous     | `Product`, `Order`, `OrderStatus`                   |
| Route folders/files            | Next.js App Router convention: lowercase, hyphenated for multi-word segments                  | `about-shop/`, `checkout/confirmation/`             |
| Firestore-mirrored field names | camelCase, matching Database.md Section 3 exactly                                             | `availabilityStatus`, `customerPhone`               |
| Constants                      | SCREAMING_SNAKE_CASE for primitive constants; PascalCase for enum-like objects                | `OTP_RESEND_COOLDOWN_SECONDS`, `OrderStatus.PLACED` |
| Test files                     | Mirror the file under test's name, suffixed `.test.ts` (unit/integration) or `.spec.ts` (e2e) | `productService.test.ts`, `farmer-checkout.spec.ts` |
| CSS/design token variables     | kebab-case, matching UI_UX.md Section 17's token names exactly                                | `--color-primary-600`, `--space-4`                  |

**Rule of thumb:** any name that appears in Database.md (collection names, field names, enum values) is copied verbatim into the codebase — never re-cased, abbreviated, or renamed along the way — so a developer can always search the codebase for a Database.md term and find every place it's used, with no mental translation required.

---

## 15. Import Conventions

- **Absolute imports from `src/`**, configured via `tsconfig.json` path aliases, are used throughout in preference to long relative paths (e.g., `import { ProductCard } from '@/components/shared/ProductCard'` rather than `'../../../components/shared/ProductCard'`), improving readability and making files easier to move without breaking imports.
- **Feature public-surface imports only:** as established in Section 11.1, cross-feature imports must go through a feature's `index.ts` (e.g., `import { useCart } from '@/features/cart'`), never reach into a feature's internal folders directly (`@/features/cart/hooks/useCart` is disallowed from outside the `cart` feature itself).
- **No default exports for components**, in favor of named exports throughout — this keeps import statements self-documenting (the imported name always matches the exported name exactly) and avoids the inconsistent naming that default exports can silently permit across a large codebase.
- **Type-only imports are marked explicitly** (`import type { Product } from '@/types/product'`) where a module imports only for typing purposes, keeping the distinction between runtime and compile-time dependencies clear and enabling more effective bundler tree-shaking.

---

## 16. Example File Organization

To illustrate how the conventions above combine in practice, here is the complete set of files involved in implementing a single functional requirement — **PRD FR-19/FR-20: farmer views order history and cancels an order** — without showing any of their contents:

```
src/
├── app/(farmer)/orders/page.tsx                       # Route: composes the feature's screen component
├── app/(farmer)/orders/[orderId]/page.tsx               # Route: composes the order detail screen component
│
├── features/orders/
│   ├── components/farmer/
│   │   ├── OrderHistoryList.tsx                          # F10 screen content
│   │   ├── OrderDetailScreen.tsx                           # F11 screen content
│   │   └── CancelOrderDialog.tsx                            # Confirmation dialog (UI_UX.md §21.6)
│   ├── hooks/
│   │   ├── useOrderHistory.ts                                 # Wraps orderService + phone-linked auth state
│   │   └── useCancelOrder.ts
│   ├── services/orderService.ts                                 # listOrdersByPhone(), cancelOrder()
│   ├── types.ts                                                    # Order, OrderStatus re-exported from src/types
│   ├── schema.ts                                                    # Zod schema reused from src/schemas for validation
│   └── index.ts                                                     # Exports OrderHistoryList, useOrderHistory, etc. for other features
│
├── features/auth/
│   ├── hooks/usePhoneVerification.ts                                # OTP request/verify + credential linking
│   └── index.ts
│
├── lib/repositories/orderRepository.ts                                # queryOrdersByCustomerPhone(), updateOrderStatus()
├── components/shared/StatusStepper.tsx                                 # Reused from the shared component library
├── components/shared/EmptyState.tsx                                     # Reused for the "no orders yet" empty state
├── types/order.ts                                                         # Canonical Order interface
├── schemas/orderSchema.ts                                                   # Canonical Zod schema, including cancellation validation
└── constants/enums.ts                                                        # OrderStatus enum, shared everywhere above
```

This trace demonstrates the intended flow for any feature: a route composes a feature screen; the feature screen uses feature hooks; feature hooks call feature services; feature services call shared repositories; repositories talk to Firebase — with shared types, schemas, and enums referenced consistently at every layer, and shared UI components reused rather than reimplemented.

---

## 17. Future Extensibility Strategy

This folder structure is deliberately organized so that every future capability identified in Architecture.md Section 12 and UI_UX.md Section 16 slots in as an **addition**, not a reorganization:

- **Multi-shop expansion:** no folder change required — the existing `shops/{shopId}` path-scoping (Database.md) is already reflected in how repositories/services accept a `shopId` parameter throughout; a shop-selection feature would simply be a new `features/shop-discovery/` folder.
- **Online payments:** a new `features/payments/` folder, with its own components/hooks/service, integrated into the existing `features/checkout/` flow at one well-defined extension point, rather than requiring changes scattered across the codebase.
- **WhatsApp notifications:** primarily additive within `functions/src/triggers/`, alongside the existing `notifyOwnerOnNewOrder` trigger — no `src/` changes required beyond an optional notification-preferences UI addition in `features/shop-profile/`.
- **AI crop recommendations / chatbot:** a new `features/ai-recommendations/` (or similarly named) folder, consuming the existing `features/catalog` public exports for product/category data — demonstrating exactly why the feature-boundary rule (Section 11.1) matters: a brand-new feature can safely depend on catalog's stable public surface without needing to understand or modify its internals.
- **Voice ordering:** an additive capability within `features/catalog/` (or a new `features/voice-search/` feature depending on scope), layering onto the existing search functionality rather than replacing it.
- **CSV/bulk product upload:** an addition to `features/catalog/`'s existing owner-facing components and services, reusing the same `productService.createProduct()` in a loop rather than introducing new data-access code.
- **Native Android/iOS app:** because `features/*/services` and `types/`/`schemas/` contain zero React/DOM-specific code, a React Native client could import and reuse this entire business-logic layer directly, rebuilding only the `components/` and `app/` (routing/presentation) layers for the native platform — the clearest practical payoff of the module-boundary discipline established in Section 11.
- **A genuine backend API layer (if ever needed):** because all Firestore access is already funneled through `lib/repositories/` and `lib/firebase/`, introducing a real backend later would mean replacing the _contents_ of these two folders (to call a new API instead of Firestore directly) while every feature, hook, and component built on top of the service layer's public functions continues to work unchanged.

---

## Appendix: Recommended Implementation Order Within a Feature

When building out any feature folder (Section 3.1) from scratch, the following file creation order is recommended, since each step depends on the one before it — building out of this order tends to produce rework (e.g., writing a component before the type it displays is finalized):

1. **Types** (`types.ts`, or the relevant file in `src/types/` if shared) — define the shape of the data first, directly mirroring the corresponding Database.md Section 3 schema. Every subsequent step depends on this being settled.
2. **Schema** (`schema.ts`, or the relevant file in `src/schemas/`) — write the Zod validation schema against the types just defined, directly mirroring Database.md Section 5's validation rules. Having this early means both the service layer and any test fixtures can validate against it immediately.
3. **Repository** (`lib/repositories/{name}Repository.ts`) — implement the thin, typed Firestore/Storage access functions (Section 8), which can be verified in isolation against the emulator before any business logic is layered on top.
4. **Service** (`services/{name}Service.ts`) — implement the business-logic/validation layer (Section 7) on top of the repository, which can now be unit-tested against the schema from step 2 without needing any UI.
5. **Hook** (`hooks/use{Name}.ts`) — wrap the service in a React-friendly interface (loading/error/data state, or a real-time listener subscription), the first point at which the feature becomes consumable by components.
6. **Components** (`components/`) — build the actual UI, now able to consume a fully working, already-tested hook rather than being built against mocked or incomplete data.
7. **Route** (`app/...`) — wire the finished components into the Next.js route structure (Section 4), which should require minimal logic of its own by this point.
8. **Tests** (`tests/`) — while unit tests for the schema/service (steps 2 and 4) are written alongside those steps rather than deferred to the end, this final step specifically covers integration tests (repository-level, Section 12.1), Security Rules tests for any new access pattern (Database.md Section 7.4), and end-to-end tests exercising the complete route-to-Firebase path now that every layer exists.

This order is a recommendation for individual feature development, not a rigid gate — in practice, steps 1–2 for a given feature are sometimes drafted together, and rules tests (part of step 8) should exist before a feature's Firestore access is considered deployable, not merely as an afterthought. The Development Plan (the next document in this series) sequences these steps across sprints at the whole-application level.

---

**Document Status:** Approved. No application code has been generated as part of this document, per instruction. This document, together with PRD.md, Architecture.md, Database.md, and UI_UX.md, completes the full design foundation for AgriConnect Version 1 ahead of implementation.
