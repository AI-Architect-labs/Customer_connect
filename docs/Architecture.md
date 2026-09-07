# Architecture Document

## AgriConnect — Technical Architecture (Version 1, Single Shop, Multi-Shop-Ready)

---

## Document Metadata

| Field             | Value                                        |
| ----------------- | -------------------------------------------- |
| **Document Name** | Architecture.md                              |
| **Version**       | 1.1                                          |
| **Status**        | Approved                                     |
| **Last Updated**  | Phase 2 — Architecture Design                |
| **Depends On**    | PRD.md (v1.2, Approved)                      |
| **Next Document** | Database.md (Phase 3 — Detailed Data Design) |

---

# 1. System Overview

## 1.1 High-Level Architecture

AgriConnect is a **serverless, client-heavy Progressive Web App** built on Next.js and Firebase. There is no custom backend server; Firebase's managed services (Authentication, Firestore, Storage, Cloud Messaging) function as the backend, supplemented by a small set of Cloud Functions for the few operations that must not run on the client.

```
┌───────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser / PWA)                      │
│  ┌───────────────────────┐        ┌───────────────────────────┐    │
│  │   Farmer-Facing App    │        │   Owner Admin Console      │    │
│  │   (guest, no login)    │        │   (authenticated owner)    │    │
│  └───────────┬────────────┘        └────────────┬────────────────┘   │
│              │      Next.js (App Router, TypeScript, Tailwind,      │
│              │      Shadcn UI) + Service Worker (offline cache)      │
└──────────────┼──────────────────────────────────┼────────────────────┘
               │                                   │
      Firebase Client SDK                 Firebase Client SDK
               │                                   │
┌──────────────▼───────────────────────────────────▼───────────────────┐
│                          FIREBASE PLATFORM                           │
│  ┌───────────┐ ┌────────────┐ ┌───────────┐ ┌─────────────────────┐ │
│  │   Auth    │ │  Firestore │ │  Storage  │ │  Cloud Messaging    │ │
│  │ (Anon +   │ │  (shop-    │ │ (product  │ │  (owner push        │ │
│  │  Phone +  │ │  scoped    │ │  images,  │ │   notifications)    │ │
│  │  Email)   │ │  data)     │ │  shop     │ │                     │ │
│  │           │ │            │ │  photo)   │ │                     │ │
│  └───────────┘ └─────┬──────┘ └───────────┘ └──────────▲──────────┘ │
│                      │ onCreate trigger                 │            │
│               ┌──────▼──────────────────────────────┐  │            │
│               │        Cloud Functions               │  │            │
│               │  - notifyOwnerOnNewOrder ─────────────┘            │
│               │  - (future) analytics rollups                       │
│               │  - (future) integration webhooks                    │
│               └───────────────────────────────────────┘            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            Firebase Hosting (Next.js SSR/Edge runtime)        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

## 1.2 Architectural Principles

These principles govern every design decision in this document and should be used to evaluate any future change to the system:

1. **No custom backend beyond what Firebase requires.** Every additional server component is operational overhead and cost. Cloud Functions are used only where a client cannot be trusted to perform an action (privileged notification, price/subtotal validation, future integrations).
2. **Tenant isolation is structural, not conventional.** Shop data is isolated by Firestore path (`shops/{shopId}/...`), not by a filterable field. A bug in a query filter cannot leak data across shops if the data isn't reachable at all without the correct path.
3. **Identity is layered, not binary.** Users are not simply "logged in" or "logged out." There are three graduated trust tiers (anonymous, phone-linked, owner), each unlocking exactly the capability it needs and no more.
4. **The client proposes, the security rules dispose.** Client-side validation exists for UX responsiveness, but Firestore Security Rules are the sole source of truth for what is actually permitted. No business rule is "trusted" purely because the client enforced it.
5. **Optimize for guest-first usability without sacrificing data integrity.** Every design choice that removes friction for farmers (no login, prefill, guest checkout) is paired with a corresponding safeguard (anonymous auth, phone-match rules, schema validation) so usability gains never become security or data-quality liabilities.
6. **Design for the shop that exists, not the marketplace that might exist.** Multi-shop and marketplace scenarios are accounted for structurally (path-based scoping, service-layer abstraction) but not built. Speculative generality beyond this would waste effort and add complexity the current business doesn't need.
7. **Everything expensive to retrofit is decided now; everything cheap to retrofit is deferred.** Data modeling, tenant isolation, and auth architecture are "expensive to retrofit" and are fully designed in V1. UI theming, analytics sophistication, and integrations are "cheap to retrofit" and are deliberately left simple.

## 1.3 Technology Stack

| Layer              | Technology                                                 | Rationale                                                                                                                 |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend framework | Next.js (App Router)                                       | SSR/ISR for fast first paint on slow rural connections; file-based routing suits the farmer/owner route split             |
| Language           | TypeScript                                                 | Type safety across UI, service layer, and Firestore data shapes; catches schema drift at compile time                     |
| Styling            | Tailwind CSS                                               | Utility-first, fast to iterate, keeps bundle size predictable                                                             |
| UI Components      | Shadcn UI                                                  | Accessible, unstyled-by-default primitives that compose cleanly with Tailwind; avoids heavy component-library bundle cost |
| Client state       | Zustand                                                    | Minimal-boilerplate store for cart/UI state; avoids Context re-render overhead for frequent quantity updates              |
| Auth               | Firebase Authentication (Anonymous, Phone, Email/Password) | Native support for the three-tier identity model, no custom auth server needed                                            |
| Database           | Cloud Firestore                                            | Serverless, real-time, scales automatically, free-tier friendly at current volume                                         |
| File storage       | Firebase Storage                                           | Product/shop images, integrates natively with Firestore security model                                                    |
| Push notifications | Firebase Cloud Messaging (FCM)                             | Owner notification on new orders, no third-party notification service needed                                              |
| Serverless compute | Cloud Functions (Node.js/TypeScript)                       | The only privileged server-side logic (order-triggered notification, future aggregation/integrations)                     |
| Hosting            | Firebase Hosting (Next.js framework integration)           | Serves SSR and static assets from the same platform as the rest of the stack                                              |
| PWA tooling        | Workbox (service worker)                                   | Offline caching, installability                                                                                           |
| CI/CD              | GitHub Actions                                             | Automated lint/type-check/rules-test on PR, staged deployment on merge                                                    |

## 1.4 Key Design Decisions (Summary)

| Decision                                                  | Alternative Considered                       | Why This Choice                                                                                                                                                                                                         |
| --------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subcollections under `shops/{shopId}`                     | Flat collections with a `shopId` field       | Structural isolation is un-bypassable by a rules bug; a flat model relies on every rule and query remembering to filter correctly                                                                                       |
| Anonymous auth for all farmer sessions                    | Fully unauthenticated writes                 | Firestore rules cannot meaningfully restrict writes with no `request.auth` at all; anonymous auth gives every write a stable, rule-checkable identity at zero UX cost                                                   |
| Phone-linked auth only for history/cancellation           | Requiring phone auth for all farmers upfront | Preserves true guest checkout (PRD requirement) while still closing the one real data-exposure gap                                                                                                                      |
| Denormalized order line items                             | Reference to `productId` only                | Preserves historical accuracy of what a farmer actually ordered/paid, even if the product is later edited, repriced, or deleted                                                                                         |
| Customer document keyed by phone number                   | Auto-generated document ID + query by phone  | Turns the highest-frequency lookup (returning-customer prefill) into an O(1) direct read with no index required                                                                                                         |
| Client-computed analytics (V1) vs. pre-aggregated rollups | Building rollups immediately                 | At current order volume (10–50/day), scanning raw orders client-side is fast and cheap; rollups add complexity that isn't yet justified — but the service-layer boundary makes this swappable later without touching UI |
| No offline background-sync for order writes               | Queue orders offline, sync later             | An order is a real-world commitment; silently deferred submission risks farmer confusion about whether it "went through." Read-caching is offline-friendly; writes require a live connection with clear messaging       |

---

## Assumptions (Version 1)

These are the key architectural assumptions underpinning this design. If any of these change, the corresponding sections of this document should be revisited before implementation proceeds.

1. **Single shop, single owner, at launch.** The system is built for exactly one shop and one owner account in V1. Multi-shop and multi-owner scenarios are structurally accommodated (Section 9.1) but not implemented or tested against real usage yet.
2. **Expected scale holds for the V1 horizon.** Roughly 100–500 farmers, 50–300 products, and 10–50 orders/day. Firestore's free-tier limits, indexing strategy, and client-computed analytics (Section 4.4, Section 9) are all sized against this assumption. A 10–100x increase in any of these numbers should trigger a re-evaluation of the analytics and rate-limiting approach specifically.
3. **Farmers primarily use Android phones, individually or on a shared family device, with intermittent connectivity.** This shapes the PWA-first platform choice, the offline-read/no-offline-write design (Section 8.5), and the decision to key returning-customer prefill by phone number rather than a stronger device identity.
4. **A phone number is an acceptable, if imperfect, identity proxy for a farmer.** The architecture assumes phone numbers are mostly stable and personally associated, understanding that shared family phones and eventual number recycling introduce some data-quality noise (accepted and documented as an edge case, not treated as a security failure).
5. **The owner will manually confirm every order before committing to delivery.** This human-in-the-loop step is assumed to remain part of the business process indefinitely in V1, and is relied upon architecturally as the safety net for both inventory-accuracy drift (Section 4.3) and guest-checkout data-quality gaps (Section 11).
6. **No payment processing occurs within the system.** All monetary handling is Cash on Delivery, off-platform. The architecture assumes zero PCI-DSS or payment-data compliance burden as a result; this assumption must be revisited the moment online payments (Section 12) are introduced.
7. **Firebase remains the platform of choice for the life of V1.** The service-layer abstraction (Section 2.4) reduces, but does not eliminate, the cost of a future platform migration. The architecture assumes no near-term need to move off Firebase.
8. **The owner has (or will obtain) a device capable of receiving push notifications and a billing account for the Blaze plan.** This is a soft prerequisite for the order-notification flow (Section 7 of the PRD, Section 10.3 here) and is assumed to be a one-time, low-friction setup step rather than an ongoing burden.
9. **English is sufficient for V1 launch.** Telugu localization is assumed to be a near-term but not immediate need, justifying an i18n-ready structure now without full translation content in V1.
10. **Content moderation is not required.** All catalog content is entered by a single trusted owner; the architecture assumes no need for content review/approval workflows in V1, unlike a multi-shop marketplace would eventually require.

---

# 2. Component Architecture

## 2.1 Frontend

The frontend is organized around **two distinct experiences sharing one codebase**: the Farmer app (guest-first, browsing/ordering focused) and the Owner console (authenticated, management focused). They are split at the route-group level in Next.js so each can have its own layout shell, navigation pattern, and data-loading strategy without conditional branching inside shared components.

- **Farmer experience:** bottom tab navigation (Home, Categories, Cart, My Orders, About Shop), optimized for one-handed mobile use, minimal text, large tap targets.
- **Owner experience:** sidebar navigation (Dashboard, Products, Categories, Orders, Shop Settings), optimized for a stable Android or desktop browsing session where the owner reviews orders throughout the day.
- **Shared component library:** presentational UI primitives (Shadcn-based) and cross-cutting feature components (ProductCard, AvailabilityBadge, ImageCarousel, PriceTag, CallShopButton, StatusStepper) are used by both experiences, ensuring visual and behavioral consistency without duplication.

## 2.2 Backend

There is no traditional backend application server. "Backend" responsibilities are distributed as follows:

- **Data persistence, querying, and real-time sync:** Firestore, accessed directly by the client SDK (governed by Security Rules — see Section 7).
- **File storage:** Firebase Storage, accessed directly by the client SDK for reads; writes restricted to the authenticated owner.
- **Privileged/trusted logic:** Cloud Functions, used only where client-side execution would be inappropriate or insecure:
  - `notifyOwnerOnNewOrder` — Firestore `onCreate` trigger on an order document, sends an FCM push to the owner's registered device.
  - Reserved for future use: analytics rollup aggregation, payment webhook handling, WhatsApp integration, AI recommendation calls — all additive, none required for V1 beyond the notification trigger.

This "backend" is intentionally minimal. It is not a limitation of the architecture — it is the correct shape for a system at this scale and budget, and it can grow a genuine server-side layer later (e.g., if multi-shop billing or complex integrations demand it) without disrupting the client architecture, because the service layer (Section 2.4) already abstracts data access behind stable interfaces.

## 2.3 Firebase Services

| Service                   | Role in System                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication            | Issues and manages identity across all three trust tiers (anonymous, phone-linked, owner)                                                                                 |
| Firestore                 | System of record for shops, products, categories, orders, and customers                                                                                                   |
| Storage                   | Stores product images and shop photo, organized under shop-scoped paths                                                                                                   |
| Cloud Messaging           | Delivers real-time push notifications to the owner's device on new orders                                                                                                 |
| Cloud Functions           | Executes the one piece of privileged server-side logic in V1 (order notification trigger), and is the designated home for all future server-side logic                    |
| Hosting                   | Serves the Next.js application (SSR routes and static assets)                                                                                                             |
| App Check _(recommended)_ | Verifies that requests to Firestore/Storage/Functions originate from the genuine app rather than a script — an additional layer against abuse of the anonymous-write path |

## 2.4 Service Layer

The service layer (`lib/services/*`) is a **repository pattern** that sits between UI components and the Firebase SDK. No UI component calls Firestore or Storage directly. Instead, each domain area exposes a small set of intention-revealing functions:

- `productService` — list/search products, create/update/delete (owner), toggle availability
- `categoryService` — list/create/update/reorder/deactivate categories
- `orderService` — create order, list orders (by shop/status/date, or by verified phone), update order status, cancel order
- `customerService` — look up customer by phone (for prefill), upsert customer record
- `shopService` — read/update shop profile (About the Shop details), business hours, shop photo

**Why this layer exists:**

- It centralizes validation logic (e.g., "discount must not exceed MRP," "order subtotal must equal the sum of line items") in one place, used both for responsive client-side checks and as the model that the Firestore rules independently re-enforce.
- It decouples UI components from the specific persistence technology. If the system later needs a real backend API (e.g., post-multi-shop, or when payment processing is introduced), only this layer changes — components and hooks remain untouched.
- It is the natural seam for future replacement of client-computed analytics with server-computed rollups (Section 9), since the dashboard calls `analyticsService`, not Firestore, directly.

## 2.5 Repository Layer

Within the service layer, Firestore access itself is further wrapped by lightweight **repository modules** using Firestore's typed converters, ensuring that every read/write into a collection is shaped according to the corresponding TypeScript interface (`Product`, `Order`, `Customer`, etc.). This repository layer is intentionally thin — its job is type-safety and query composition, not business logic (which lives one layer up, in the services). This separation keeps each layer testable in isolation: repository logic can be tested against the Firebase emulator; service-layer validation logic can be tested with plain unit tests.

---

# 3. Folder Structure

```
agriconnect/
├── src/
│   ├── app/                                # Next.js App Router
│   │   ├── (farmer)/                       # Farmer-facing route group — guest experience
│   │   │   ├── page.tsx                    # Home: category grid + featured products
│   │   │   ├── category/[categoryId]/      # Category product listing
│   │   │   ├── product/[productId]/        # Product detail (gallery, price, availability)
│   │   │   ├── cart/                       # Cart review before checkout
│   │   │   ├── checkout/                   # Guest checkout form (name/phone/address)
│   │   │   ├── orders/                     # OTP-gated order history & cancellation
│   │   │   └── about-shop/                 # Shop info + Call Shop button
│   │   │
│   │   ├── (owner)/                        # Owner-facing route group — authenticated
│   │   │   ├── login/                      # Owner email/password login
│   │   │   ├── dashboard/                  # Order summary + sales analytics
│   │   │   ├── products/                   # Product CRUD
│   │   │   ├── categories/                 # Category management
│   │   │   ├── orders/                     # Order queue & status management
│   │   │   └── shop-settings/              # About-the-shop content, business hours, photo
│   │   │
│   │   ├── layout.tsx                      # Root layout, providers (Auth, Theme)
│   │   └── manifest.ts                     # PWA manifest definition
│   │
│   ├── components/
│   │   ├── ui/                             # Shadcn primitives (button, dialog, input, badge…)
│   │   ├── shared/                         # Cross-cutting feature components:
│   │   │                                   #   ProductCard, AvailabilityBadge, ImageCarousel,
│   │   │                                   #   PriceTag, CallShopButton, StatusStepper
│   │   ├── farmer/                         # Farmer-only composed components (CartSummary, AddressForm…)
│   │   └── owner/                          # Owner-only composed components (OrderQueueRow, ProductForm…)
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts                   # Firebase app initialization
│   │   │   ├── auth.ts                     # Anonymous/phone/email auth helpers
│   │   │   ├── firestore.ts                # Firestore instance + typed converters
│   │   │   └── storage.ts                  # Storage upload/read helpers
│   │   │
│   │   ├── services/                       # Service layer (see §2.4)
│   │   │   ├── productService.ts
│   │   │   ├── categoryService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── customerService.ts
│   │   │   ├── shopService.ts
│   │   │   └── analyticsService.ts
│   │   │
│   │   ├── i18n/                           # Translation keys (English now, Telugu-ready structure)
│   │   └── utils/                          # Formatting, validation helpers, constants
│   │
│   ├── hooks/                              # useCart, useProducts, useCategories,
│   │                                        # useOrderStatus, useOtpVerify, useOwnerAuth,
│   │                                        # useAnalytics
│   │
│   ├── store/                              # Zustand stores (cart, UI state — see §6)
│   │
│   ├── types/                              # Shared TypeScript interfaces:
│   │                                        # Shop, Product, Category, Order, Customer, Owner
│   │
│   └── config/                             # Feature flags, app-wide constants
│
├── functions/                              # Cloud Functions (separate deploy target)
│   └── src/
│       ├── notifyOwnerOnNewOrder.ts
│       └── index.ts
│
├── public/
│   ├── icons/                              # PWA icon set (multiple sizes)
│   └── sw.js                               # Generated service worker (Workbox build output)
│
├── firestore.rules                         # Firestore Security Rules
├── firestore.indexes.json                  # Composite index definitions
├── storage.rules                           # Storage Security Rules
└── firebase.json                           # Firebase project configuration
```

## 3.1 Explanation of Major Folders

- **`app/(farmer)`** — Every route a farmer can reach without authentication. Grouped separately so its layout (bottom tab nav, guest-friendly styling) never leaks into the owner experience, and so route-level code splitting keeps the farmer bundle free of owner-only logic.
- **`app/(owner)`** — Every authenticated route. Wrapped by an auth guard at the layout level; unauthenticated access redirects to `login`.
- **`components/ui`** — Unmodified or lightly themed Shadcn primitives. Kept separate from feature components so design-system upgrades don't require touching business logic.
- **`components/shared`** — Components used by both farmer and owner surfaces (e.g., `AvailabilityBadge` appears on both the farmer product card and the owner product management table). Prevents duplicate implementations drifting out of sync.
- **`lib/firebase`** — The only place the raw Firebase SDK is imported. Everything else in the app talks to `lib/services`, never to `firebase/firestore` directly — this is what keeps the repository pattern honest.
- **`lib/services`** — The repository/service layer described in Section 2.4. This is the architectural seam that makes future changes (backend API, new data sources, rollup-based analytics) low-risk.
- **`hooks`** — React-idiomatic wrappers around services, typically combining a Firestore real-time listener with loading/error state, so components consume `useProducts()` rather than orchestrating Firestore subscriptions themselves.
- **`store`** — Zustand stores for state that must persist across route changes without a server round-trip (cart) or that is purely ephemeral UI state shared across distant components.
- **`types`** — Single source of truth for data shapes, imported by both `lib/firebase` converters and `lib/services`, ensuring the client's understanding of a `Product` or `Order` can never silently drift from Firestore's actual structure.
- **`functions/`** — Deployed independently from the Next.js app; deliberately small in V1, but structured so new privileged operations (payment webhooks, WhatsApp sends, AI calls) are added as new files, not retrofitted into existing ones.

---

# 4. Firestore Architecture

## 4.1 Collections

Data is modeled as **subcollections nested under each shop**, making tenant isolation a structural property of the path rather than a value that must be checked in every query.

```
shops/{shopId}
  │  name, ownerUid, address, phone, businessHours,
  │  shopPhotoURL, mapLocation {lat, lng} (future), active, createdAt
  │
  ├─ categories/{categoryId}
  │     name, sortOrder, active, createdAt
  │
  ├─ products/{productId}
  │     name, brand, categoryId, description,
  │     images: [ {url, storagePath, isCover} ],
  │     unit ("kg" | "litre" | "piece" | "packet"), packSize,
  │     mrp, discountPrice (nullable),
  │     availabilityStatus ("available" | "low_stock" | "out_of_stock"),
  │     stockQty (nullable, soft signal only),
  │     active, createdAt, updatedAt
  │
  ├─ orders/{orderId}
  │     customerName, customerPhone (normalized, e.g. +91XXXXXXXXXX),
  │     address, village, landmark,
  │     items: [ {productId, name, brand, unit, qty, unitPrice} ],
  │     subtotal,
  │     status ("placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled"),
  │     statusHistory: [ {status, at, note} ],
  │     cancelReason (nullable),
  │     createdByUid (anonymous or phone-linked auth uid),
  │     createdAt, updatedAt
  │
  └─ customers/{normalizedPhone}
        name, address, village, landmark,
        lastOrderAt, totalOrders, createdAt

owners/{ownerUid}
   shopId, email, displayName, role ("owner")
```

## 4.2 Relationships

- **Shop → Categories/Products/Orders/Customers:** one-to-many, expressed via Firestore path nesting rather than a foreign-key field. A category or product cannot exist outside a shop's subtree.
- **Product → Category:** a soft reference (`categoryId` field), not a hard foreign key — Firestore has no referential integrity enforcement, so the service layer validates that a `categoryId` exists and is active before allowing a product to be saved against it.
- **Order → Products:** **deliberately denormalized.** Each order line item stores a copy of the product's name, brand, unit, and price at the time of order, rather than only a `productId` reference. This is a considered trade-off:
  - _Benefit:_ order history remains accurate and displayable even if the product is later renamed, repriced, or deleted.
  - _Cost:_ if a product's brand is corrected after the fact, historical orders won't reflect the correction. This is accepted as the right trade-off, since an order is a record of what was agreed at a point in time, not a live view of the current catalog.
- **Order → Customer:** an order's `customerPhone` is the join key to the `customers/{normalizedPhone}` document, but this is a lookup convenience, not a strict relationship — an order remains valid and displayable even if the corresponding customer document were somehow missing.
- **Owner → Shop:** `owners/{ownerUid}.shopId` is the single link resolving an authenticated owner session to the shop subtree they're permitted to manage. This is also the extension point for multi-shop: an owner document could later reference multiple shop IDs without touching any other part of the model.

## 4.3 Data Flow

**Farmer browsing (read path):**
`Firestore products/categories (real-time listener)` → `productService` → `useProducts` hook → `ProductCard` components. Changes the owner makes to price/availability propagate to any farmer actively browsing without a manual refresh.

**Farmer places an order (write path):**
Checkout form → `orderService.createOrder()` → client-side validation (required fields, computed subtotal) → Firestore write to `orders/{orderId}` (rules independently re-validate) → Firestore `onCreate` trigger fires → Cloud Function `notifyOwnerOnNewOrder` → FCM push to owner's device. In parallel, `customerService.upsertCustomer()` writes/merges the `customers/{phone}` document for future prefill.

**Owner manages an order (write path):**
Owner console order queue (real-time listener on `orders` filtered by status) → owner action (confirm/adjust/cancel/advance) → `orderService.updateStatus()` → Firestore write, validated by rules to ensure only the shop's own authenticated owner can perform it → farmer's order-status listener (if open) updates in near real-time.

**Owner reviews analytics (read path):**
Dashboard → `analyticsService` → in V1, queries raw `orders` within a date range and computes aggregates client-side (best-sellers, category breakdown, repeat-customer ratio). This is the identified upgrade point (Section 9) where a Cloud Function-maintained rollup document could later replace the raw scan without changing the dashboard's calling code.

## 4.4 Indexing Strategy

Most read patterns are served by Firestore's automatic single-field indexes or by the phone-as-document-ID design (which entirely avoids the need for an index on the most frequent lookup). The following composite indexes are required:

| Collection Path           | Composite Index                            | Supports                                                   |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `shops/{shopId}/products` | `categoryId ASC, active ASC, name ASC`     | Category browsing, alphabetized within active products     |
| `shops/{shopId}/products` | `active ASC, availabilityStatus ASC`       | Owner's low-stock/out-of-stock dashboard widget            |
| `shops/{shopId}/orders`   | `status ASC, createdAt DESC`               | Owner's order queue, filtered by status, newest first      |
| `shops/{shopId}/orders`   | `customerPhone ASC, createdAt DESC`        | Farmer's order history, after phone verification           |
| `shops/{shopId}/orders`   | `createdAt DESC` (single-field, automatic) | Owner dashboard "today's orders" and recent-activity views |

No index is required for the returning-customer prefill lookup, since it is a direct document `get()` by phone-number ID rather than a query — a deliberate modeling choice made specifically to avoid an unnecessary composite index and its associated write-time indexing cost.

---

# 5. Authentication Architecture

## 5.1 Owner Authentication

- Standard **Firebase Email/Password Authentication**.
- On successful login, the client resolves `owners/{uid}` to obtain the owner's `shopId`, scoping every subsequent query and write to that shop's subtree.
- Email verification and password-reset flows (both native to Firebase Auth) are enabled as low-cost insurance against account lockout, even for a single-owner account.
- The owner's authenticated session is the only identity tier permitted to write to `products`, `categories`, `shops/{shopId}` profile fields, and to advance order status beyond farmer-permitted transitions.

## 5.2 Farmer Authentication (Three-Tier Model)

**Tier 1 — Anonymous (default, silent, applied to every farmer session)**
On first app load, the client silently calls Firebase Anonymous Authentication — no UI is shown, and the farmer is never aware this occurred. This uid is attached to every order/customer write as `createdByUid`. Its purpose is not to identify the farmer personally, but to give Firestore Security Rules _something_ to validate structurally (e.g., "this write's `createdByUid` matches `request.auth.uid`") — a bar that fully unauthenticated writes cannot clear at all.

**Tier 2 — Phone-Linked (opt-in, only when order history or cancellation is requested)**
When a farmer taps "My Orders" or attempts to cancel an order, they enter their phone number and receive an OTP via Firebase Phone Authentication. On successful verification, the phone credential is **linked to the existing anonymous account** (via Firebase's credential-linking capability) rather than replacing it — preserving session continuity and avoiding orphaned duplicate identities. Once linked, `request.auth.token.phone_number` becomes available and is the value Security Rules match against `order.customerPhone` to authorize access. On the same device, this link can persist across future app opens, so a farmer isn't asked for OTP repeatedly on a trusted device — but a new device or cleared session requires re-verification.

**Tier 3 — N/A for farmers.** Farmers never reach a full account tier; phone-linking is the ceiling of their authentication in V1, by design.

## 5.3 Session Management

- Firebase Authentication's own client SDK persistence handles session survival across app restarts (for both anonymous and phone-linked farmer sessions, and the owner's authenticated session).
- A single `AuthProvider` (React Context wrapping Firebase Auth's state observer) is the sole source of truth for "who is this session" across the entire app — components read from this context rather than querying Firebase Auth state independently, preventing state drift.
- Anonymous sessions are intentionally long-lived (not reset per visit), since resetting them would break the "returning customer" convenience data attached to that uid over time.

## 5.4 Authorization

Authorization is derived from the identity tier and enforced at two levels:

1. **UI level (soft):** route guards and conditional rendering hide owner-only routes/actions from farmer sessions, and vice versa — this is a usability convenience, not a security boundary.
2. **Firestore rules level (hard, authoritative):** every read/write is independently checked against the requester's actual auth token and shop-path context, regardless of what the UI displayed or attempted to prevent. Full detail in Section 7.

---

# 6. State Management

AgriConnect deliberately uses a **minimal state management footprint** — the system does not warrant a heavyweight global store or client-cache framework at this scale, and introducing one would add complexity without a corresponding benefit.

## 6.1 Global State

| State                           | Mechanism                                        | Rationale                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication/session identity | React Context (`AuthProvider`)                   | Needs to be globally readable (is this an anonymous farmer, phone-linked farmer, or owner?) but changes infrequently — Context is appropriate here since re-renders on auth change are rare and expected |
| Cart contents                   | Zustand store, persisted to local device storage | Must survive across routes and app restarts without a login; frequent quantity updates need low re-render overhead, which Context would handle poorly at this update frequency                           |

## 6.2 Local State

- Component-local `useState` is used for purely presentational, non-shared state: modal open/closed, active tab, form input values before submission, filter selections on a listing page.
- No global store is used for this category of state — globalizing it would only add indirection without benefit, since nothing outside the owning component needs to read or react to it.

## 6.3 Server State

Firestore's own real-time listeners substitute for a traditional client-side server-state cache (the role a library like React Query might otherwise play):

- `useProducts`, `useCategories` — real-time listeners scoped to the active shop's catalog, so farmers see owner-side price/availability changes without a manual refresh.
- `useOrderStatus` — a real-time listener scoped to a specific order (or the verified farmer's set of orders), giving live status updates without polling.
- `useOwnerOrderQueue` — a real-time listener scoped to `shops/{shopId}/orders`, filtered by status/date range, powering the owner's live order queue and dashboard counts.

Because Firestore listeners already provide caching, real-time updates, and offline read fallback natively, adding a further caching layer (React Query, SWR) on top would be redundant at this scale. This is explicitly flagged as a decision to revisit only if data-fetching patterns become significantly more complex (e.g., cross-collection joins, heavy client-side derived state) — not a permanent constraint.

## 6.4 Zustand Usage

Zustand is scoped narrowly and deliberately:

- **Cart store:** holds line items (`productId`, quantity, and a denormalized price/name snapshot for display), exposes `addItem`, `updateQuantity`, `removeItem`, `clearCart`, and a computed `subtotal` selector. Persisted via a storage adapter so a farmer's cart survives app restarts without requiring login.
- **UI store (optional, small):** transient cross-component UI flags that don't fit cleanly as local state (e.g., "checkout in progress" spinner state shared between the checkout button and a global loading indicator).

Zustand is intentionally **not** used for server-derived data (products, orders) — that data's source of truth is Firestore itself via listeners, and duplicating it into a separate client store would create two sources of truth that could drift out of sync.

---

# 7. Security Architecture

## 7.1 Firestore Rules (Principles)

Firestore Security Rules are the **sole authoritative enforcement point** for what any client — farmer or owner — is permitted to read or write. The following principles govern the rules design (the rules implementation itself is a build-phase artifact, not reproduced here per the no-code instruction):

1. **Deny by default.** No collection is accessible unless an explicit rule grants it.
2. **Path-derived shop scoping.** Every rule extracts `shopId` from the request path itself and validates against it — never from a `shopId` field inside the document body, which a modified client could forge.
3. **Public reads, owner-gated writes for catalog data.** Shop info, categories, and products are readable by anyone (required for guest browsing), but writable only when `owners/{request.auth.uid}.shopId` matches the path's `shopId`.
4. **Schema-validated order creation.** An order write on creation must include all required fields, a non-empty `items` array, a `subtotal` that matches the computed sum of line items (preventing client-side price tampering), and a `status` of exactly `"placed"`.
5. **Phone-matched access for sensitive farmer data.** Reading an order's history or writing a cancellation requires `request.auth.token.phone_number` to equal the target order's `customerPhone` — available only after Tier 2 (phone-linked) authentication. This single rule is what makes guest checkout safe from cross-farmer data exposure.
6. **Immutable progression past `placed`.** Once an order's status advances beyond `placed`, farmer-side writes (including cancellation) are rejected outright; only the shop's authenticated owner can advance status further.
7. **Owner writes are shop-scoped, not globally privileged.** An authenticated owner can only write within their own `shops/{shopId}` subtree, even if a second shop existed in the same Firestore instance in a future multi-shop version.

## 7.2 Storage Rules

Mirror the Firestore model directly:

- Product images and the shop photo are **publicly readable** (required for guest browsing).
- Writes to a shop's storage path (`shops/{shopId}/products/**`, `shops/{shopId}/shopPhoto`) are permitted only for the authenticated owner whose `owners/{uid}.shopId` matches that path.
- File type and size constraints are enforced at the rules level (not just the client), preventing upload of arbitrary or oversized files even if a modified client attempted it.

## 7.3 Authentication (Security Considerations)

- Anonymous authentication alone provides no protection against a scripted client generating unlimited fake anonymous sessions and orders. This is why anonymous auth is paired with:
  - **Schema validation** on every order write (Section 7.1, point 4), which prevents malformed or nonsensical data even from a determined scripted client.
  - **App Check** (recommended addition), attached to Firestore/Storage/Functions requests, which verifies the request genuinely originates from the deployed app rather than a script hitting the API directly — a meaningful additional barrier at negligible cost.
- Phone authentication's OTP delivery is rate-limited by Firebase itself by default, providing baseline protection against OTP-spam abuse.

## 7.4 Validation

Validation exists at two layers, intentionally redundant:

- **Client-side (service layer):** immediate, responsive feedback — e.g., blocking a discount price greater than MRP before the owner even attempts to save, or preventing checkout submission with an empty cart. This layer exists purely for UX quality.
- **Rules-level (authoritative):** the same constraints are independently re-checked at the database layer, because client-side validation can always be bypassed by a modified client or direct API call. Nothing is considered "validated" unless the rules enforce it.

## 7.5 Rate Limiting

Firestore Security Rules have no native concept of rate limiting (e.g., "max 5 orders per phone number per hour"). Given V1's scale (10–50 orders/day total), this is an acceptable gap for launch, mitigated by:

- App Check reducing the likelihood of scripted abuse reaching this far.
- The owner's manual confirmation step (Section 4.3/PRD Section 7) acting as a final human checkpoint before any order becomes a real commitment.
- **Documented future enhancement:** if abuse becomes a real pattern, a Cloud Function trigered on order creation can enforce rate limits server-side (e.g., rejecting/flagging orders from a phone number exceeding a threshold), since this requires stateful counting that Security Rules alone cannot perform.

## 7.6 Input Sanitization

- All free-text fields (address, village, landmark, customer name, product description) are treated as **display-only data**, never interpolated into executable contexts (no server-side templating, no direct HTML injection risk since React escapes rendered text by default).
- Phone numbers are normalized to a consistent format (e.g., `+91XXXXXXXXXX`) at the point of entry in the service layer, both for consistent customer-document keying and to reduce malformed-data edge cases.
- File uploads (product/shop images) are constrained by file type and size at both the client (immediate feedback) and Storage rules (authoritative) layers.
- Product image uploads use application-level compensation because Firestore and Storage cannot share an atomic transaction. Each newly uploaded path is recorded; if a later upload or the product document write fails, only objects uploaded by that attempt are deleted on a best-effort basis. Images that existed before an edit are never part of this rollback set.
- Product deletion remains a soft-delete: its images are retained so the product can be restored and historical/audit context remains intact. Permanent object purging is a separate future retention-policy operation, not part of ordinary product deletion.

---

# 8. Performance Strategy

## 8.1 Caching

- Firestore's client SDK provides automatic in-memory and IndexedDB-backed local caching for all active listeners, meaning repeated navigation to a previously viewed category or product does not require a fresh network round-trip.
- The Workbox service worker additionally caches the app shell (JS/CSS/fonts) and applies a **stale-while-revalidate** strategy to catalog images and shop info, so returning farmers see content instantly while it refreshes silently in the background.

## 8.2 Lazy Loading

- Route-level code splitting is automatic under Next.js's App Router — the owner console bundle is never downloaded by a farmer session, and vice versa.
- Below-the-fold product images and long lists use lazy loading (`loading="lazy"` semantics / intersection-observer-based loading) so initial page weight stays low on constrained rural connections.

## 8.3 Image Optimization

- Product images are resized/compressed at upload time (owner-side) before storage, avoiding the need to serve unnecessarily large files to farmers on limited data plans.
- Next.js's built-in image optimization pipeline serves appropriately sized images per device/viewport, and modern formats (e.g., WebP) where supported, falling back gracefully otherwise.
- The multi-image gallery (per FR-9) lazy-loads non-cover images only when a farmer actually opens the gallery, rather than pre-loading all images for every product in a listing.

## 8.4 Pagination

- Product and order listings use **cursor-based pagination** (`startAfter` on a Firestore query), not offset-based pagination, so performance does not degrade as the catalog or order history grows — a critical distinction for long-term scalability that costs nothing extra to implement correctly from the start.

## 8.5 Offline Support

- **Reads:** catalog and shop-info data remain available from cache when offline, with a subtle "showing saved data" indicator so farmers aren't confused about staleness.
- **Writes:** deliberately **not** queued for silent background sync in V1 (see Section 1.4's design decision rationale) — checkout blocks with a clear "no internet connection, please retry" state instead, prioritizing farmer trust and clarity over convenience.
- **Idempotency:** each checkout submission carries a client-generated request identifier, ensuring a retried submission after a dropped connection cannot create a duplicate order.

---

# 9. Scalability Strategy

## 9.1 Multi-Shop Architecture

The single most important scalability decision in this system — path-based tenant isolation (`shops/{shopId}/...`) — was made specifically so that **onboarding a second shop requires zero schema change and zero data migration.** A new shop is simply a new document at `shops/{newShopId}` with its own categories/products/orders/customers subtree. The existing Security Rules already generalize correctly, since they derive `shopId` from the request path rather than hardcoding a single shop's identifier anywhere.

What multi-shop _would_ additionally require (explicitly deferred, not built now):

- A shop-selection mechanism for farmers (e.g., subdomain or path-slug resolution to a `shopId`, or a shop directory/search screen).
- Extending `owners/{uid}` to reference multiple `shopId`s if a single owner manages more than one location.
- Potential introduction of subscription/billing logic (explicitly out of scope per the PRD's business model).

## 9.2 Future Marketplace Support

If AgriConnect evolves from "single shop's ordering tool" toward a lightweight marketplace (multiple shops discoverable by farmers in a region), the architecture accommodates this without structural rework:

- The service layer (Section 2.4) already abstracts "which shop" as a parameter to every function — a marketplace's shop-discovery UI would simply call the same services with a different, farmer-selected `shopId`.
- Cross-shop farmer identity (a farmer ordering from two different shops) is already naturally supported, since farmer identity (anonymous/phone-linked) is not shop-scoped — only the data being ordered is.

## 9.3 AI Integration Readiness

Two AI capabilities are named as future enhancements in the PRD: crop recommendations and chatbot assistance. The architecture supports both without requiring foundational changes:

- **Crop recommendations** would consume existing product/category data (already structured with brand, category, and description fields) as input to a recommendation model or third-party AI API call — implemented as a new Cloud Function or client-side call to an external AI service, slotting into the existing `functions/` directory or a new `aiService` in the service layer.
- **Chatbot assistance** would similarly be additive: a new route/component surface calling out to an AI API (potentially via a Cloud Function to keep any API keys server-side and never exposed to the client), reading from the same product/category data already modeled.
- No current data model decision blocks either capability; the risk to manage when the time comes is keeping any AI API keys server-side (Cloud Functions), never embedding them in client code.

## 9.4 Multi-Language Readiness

- All user-facing text is already sourced from an i18n key structure (`lib/i18n/`) rather than hardcoded strings, per FR-33 — English is the only populated language in V1, but adding Telugu (or any other language) is a translation-content task, not a re-engineering task.
- Firestore text fields (product names, descriptions, category names) are currently single-language. If true multi-language _content_ (not just UI chrome) is required later, the schema would need a documented, additive change — e.g., `name: { en: "...", te: "..." }` — which is a forward-compatible schema evolution, not a breaking one, since existing single-language reads can be migrated incrementally.

---

# 10. Deployment Architecture

## 10.1 Firebase Hosting

- The Next.js application is deployed via **Firebase Hosting's native Next.js framework integration**, which serves both SSR routes (e.g., product detail pages benefit from server-rendering for faster first paint) and static assets from the same platform as the rest of the Firebase stack — no separate hosting provider or CDN configuration is required.

## 10.2 CI/CD

- **Source control and pipeline:** GitHub Actions.
- **On every pull request:** automated linting, TypeScript type-checking, and Firestore/Storage Security Rules unit tests run against the Firebase Local Emulator Suite — rules changes are never merged without passing tests that assert both "legitimate access succeeds" and "cross-tenant/cross-farmer access fails."
- **On merge to `main`:** automatic deployment to a staging environment.
- **Promotion to production:** a manual approval gate, consistent with the PRD's stated priority of "quality over speed" for a real production business.

## 10.3 Environment Configuration

Three fully isolated Firebase projects are used, each with its own Authentication, Firestore, Storage, and Functions instances:

| Environment           | Purpose                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `agriconnect-dev`     | Local development and manual testing; safe to reset/seed freely                                                    |
| `agriconnect-staging` | Pre-production validation against production-like data and rules, used for owner acceptance testing before go-live |
| `agriconnect-prod`    | The live shop's real data — never used for testing                                                                 |

This isolation ensures that no development or testing activity can ever risk the real shop owner's live product catalog, order data, or farmer information.

**Platform note on cost:** Cloud Functions (required for the owner push-notification trigger) require Firebase's **Blaze (pay-as-you-go)** plan rather than the free Spark plan — this is a Firebase platform requirement, not an architectural choice. At AgriConnect's expected usage volume, actual charges remain effectively zero (within Blaze's own free quota), but a billing account must be attached as a one-time setup step.

---

# 11. Risks and Trade-offs

| Risk / Trade-off                                                                             | Impact                                                                                                                          | Mitigation / Rationale                                                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Denormalized order line items mean historical orders don't reflect later product corrections | Minor data inconsistency (by design)                                                                                            | Accepted trade-off — an order is a record of what was agreed at the time, not a live catalog view                                                                        |
| No native rate limiting on order creation                                                    | Potential for scripted abuse at scale                                                                                           | App Check recommended; owner's manual confirmation call is the final human safety net; server-side rate limiting documented as a future enhancement if abuse is observed |
| Client-computed analytics will slow down as order volume grows very large                    | Dashboard performance degradation at high scale (not current scale)                                                             | Clear, pre-identified upgrade path to Cloud Function-maintained rollup documents, isolated behind the existing `analyticsService` interface                              |
| No offline background-sync for order writes                                                  | Farmers with poor connectivity may need to retry checkout                                                                       | Deliberate trust/clarity trade-off over silent convenience; revisit if real-world usage shows this is a frequent pain point                                              |
| Anonymous-session farmer identity is inherently weaker than a true account                   | A farmer's device/browser data (cart, linked phone) is tied to that device, not portable across devices without re-verification | Acceptable given the explicit goal of zero-friction guest checkout; phone-linking provides a bridge when the farmer actually needs continuity (order history)            |
| Cloud Functions requiring the Blaze plan                                                     | Owner must attach a billing account, a small trust/setup hurdle for a "free" product                                            | Real-world cost remains ~$0 at this scale; framed clearly to the owner as a one-time setup step, not an ongoing cost                                                     |
| Single shop owner, no backup admin access modeled in V1                                      | Operational single point of failure if the owner loses device/credential access                                                 | Recommend (not enforced) that the owner set up account recovery (verified email) and consider a trusted backup contact; not a blocking V1 requirement                    |
| Firestore's lack of true relational integrity (e.g., `categoryId` references)                | A category could theoretically be deleted while products still reference it                                                     | Service layer enforces referential checks before deactivation is allowed (e.g., preventing deletion of a category with active products, or reassigning them first)       |

---

# 12. Future Extensibility

The architecture is deliberately built so the following future directions are **additive changes**, not redesigns:

- **Multi-shop marketplace:** enabled by existing path-based tenant isolation; requires only a shop-discovery UI layer and minor `owners` schema extension.
- **Subscription/commission monetization:** would introduce a billing-related collection and Cloud Function integration (e.g., Stripe/Razorpay webhooks), isolated from the core ordering data model entirely.
- **WhatsApp notifications:** a new Cloud Function reacting to the same order-status-change events already modeled, calling a WhatsApp Business API instead of (or alongside) FCM.
- **Online payments:** would extend the order schema with a `paymentStatus`/`paymentMethod` field and introduce a payment-gateway Cloud Function; the COD-only assumption is isolated to a small number of checkout-flow and rules checks, not scattered throughout the system.
- **AI crop recommendations and chatbot assistance:** consume existing, already-structured product/category data; implemented as new service-layer functions and/or Cloud Functions, with no changes required to the core catalog or order model.
- **Voice ordering (Telugu):** builds on the existing i18n-readiness and would primarily be a new input modality on top of the existing product search/browse services, not a new data model.
- **Native Android/iOS apps:** the clean separation between UI components and the service layer means a React Native (or Capacitor-wrapped) client could reuse `lib/services` and `types` largely as-is, with only the presentation layer rebuilt.
- **CSV/bulk product upload:** an additive owner-console feature calling the existing `productService.create()` function in a loop/batch, requiring no changes to the underlying data model or rules.

Every extensibility path above was evaluated against the core architectural principles in Section 1.2 at design time, specifically to confirm that pursuing any of them later would not require revisiting the tenant model, the authentication tiers, or the core Firestore schema — the three elements of this system that are genuinely expensive to change after real production data exists.

---

---

# Appendix: Architecture Decision Records (ADR Summary)

Each ADR below summarizes a significant architectural decision, the alternatives considered, and the rationale for the final choice. These are intentionally concise; full context for each lives in the corresponding section of this document.

### ADR-01: Serverless architecture on Firebase, no custom backend server

- **Alternatives considered:** Custom Node.js/Express backend with a managed database (Postgres/MongoDB); a hybrid backend-for-frontend layer.
- **Decision:** Use Firebase's managed services (Firestore, Auth, Storage, FCM) directly from the client, with Cloud Functions only for privileged operations.
- **Rationale:** Matches the near-zero budget constraint, eliminates server operational burden for a single-developer/small-team context, and Firebase's free tier comfortably covers V1's expected scale. See Section 1.1, 1.2.

### ADR-02: Subcollections under `shops/{shopId}` instead of flat collections with a `shopId` field

- **Alternatives considered:** Flat top-level collections (`products`, `orders`, etc.) with a `shopId` field on each document, filtered at query time.
- **Decision:** Nest all shop-owned data as subcollections under `shops/{shopId}`.
- **Rationale:** Makes tenant isolation a structural property of the data path rather than a convention that every query and rule must remember to apply. A missed filter in a flat model is a data leak; the same mistake is structurally impossible in a nested model. See Section 4.1, 1.4.

### ADR-03: Three-tier farmer identity (Anonymous → Phone-linked → none further) instead of mandatory login

- **Alternatives considered:** (a) No authentication at all for farmer writes; (b) mandatory phone-OTP login before any browsing or ordering.
- **Decision:** Silent anonymous authentication for all farmer sessions by default; phone-linking only when order history or cancellation is requested.
- **Rationale:** Option (a) leaves Firestore rules unable to meaningfully restrict writes at all. Option (b) violates the explicit product requirement for frictionless guest checkout. The tiered approach satisfies both the security requirement (rules have a checkable identity) and the product requirement (zero friction to browse/order). See Section 5, PRD FR-1–FR-5.

### ADR-04: Denormalized order line items instead of product references only

- **Alternatives considered:** Store only `productId` and quantity in each order line item, joining against the live product document for display.
- **Decision:** Copy product name, brand, unit, and price into each order line item at the time of order.
- **Rationale:** Preserves an accurate historical record of what a farmer actually ordered and agreed to pay, even if the product is later renamed, repriced, or deleted. Accepted trade-off: historical orders won't reflect later corrections to product data. See Section 4.2.

### ADR-05: Customer document keyed by normalized phone number instead of auto-generated ID

- **Alternatives considered:** Auto-generated document ID with a queryable `phone` field.
- **Decision:** Use the normalized phone number itself as the Firestore document ID for `customers`.
- **Rationale:** Turns the highest-frequency read pattern (returning-customer prefill at checkout) into a direct O(1) document `get()`, avoiding both a composite index and its associated write cost. See Section 4.4.

### ADR-06: Client-computed analytics in V1 instead of pre-aggregated rollups

- **Alternatives considered:** Cloud Function-maintained daily/monthly rollup documents updated on every order write, queried directly by the dashboard.
- **Decision:** Compute analytics (best-sellers, category breakdown, trends) client-side from raw order queries within a date range, for V1.
- **Rationale:** At 10–50 orders/day, a raw scan is fast and introduces no additional infrastructure. The `analyticsService` interface is the pre-identified seam where a rollup-based implementation can be substituted later without touching dashboard UI code. See Section 4.3, Section 9.

### ADR-07: No offline background-sync for order submission

- **Alternatives considered:** Queue order writes locally when offline and silently sync once connectivity returns (a common PWA pattern).
- **Decision:** Block checkout with a clear "no internet, please retry" state; only catalog reads are offline-tolerant.
- **Rationale:** An order is a real-world commitment the farmer expects to be actioned promptly. Silent deferred submission risks farmer confusion about whether an order "went through," undermining trust in a product whose core value proposition is replacing an in-person/phone interaction. See Section 8.5.

### ADR-08: Minimal state management (Zustand + Firestore listeners) instead of a heavier client-cache framework

- **Alternatives considered:** Redux Toolkit with a normalized client-side cache; React Query/SWR layered atop Firestore reads.
- **Decision:** Use Zustand narrowly for cart/UI state; rely on Firestore's own real-time listeners as the server-state layer.
- **Rationale:** Firestore listeners already provide caching, real-time updates, and offline read fallback natively. Adding a further caching layer would duplicate this functionality and introduce a second source of truth that could drift from Firestore. Explicitly flagged as revisitable if data-fetching complexity grows materially. See Section 6.

### ADR-09: Path-based (not flag-based) readiness for multi-shop and marketplace futures

- **Alternatives considered:** Build single-shop-only data model now, plan a full re-architecture if/when multi-shop is needed.
- **Decision:** Model all shop-owned data under `shops/{shopId}` from day one, even with only one shop live.
- **Rationale:** Because tenant isolation is already structural (ADR-02), onboarding a second shop later requires zero migration — a new shop is simply a new document subtree. Avoids a costly future re-architecture for a near-zero present-day cost. See Section 9.1.

### ADR-10: Cash-on-Delivery-only payment model for V1

- **Alternatives considered:** Integrate a payment gateway (UPI/cards) from launch.
- **Decision:** No online payment processing in V1; order schema and rules assume COD exclusively.
- **Rationale:** Matches the explicit business requirement, avoids all PCI-DSS/payment-compliance burden in V1, and keeps the trust barrier for first-time digital adopters (farmers) as low as possible. Payment integration is a clearly scoped future addition (Section 12), isolated to a small number of checkout-flow and schema touchpoints rather than scattered through the system.

---

**Document Status:** Approved. No application code has been generated as part of this document, per instruction. The recommended next step (now proceeding) is Database.md — a detailed data design specification building on Section 4 of this document.
