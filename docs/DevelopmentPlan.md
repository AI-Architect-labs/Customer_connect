# Development Plan

## AgriConnect — Implementation Roadmap (Version 1)

---

## Document Metadata

| Field             | Value                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Document Name** | DevelopmentPlan.md                                                                                                   |
| **Version**       | 1.0                                                                                                                  |
| **Status**        | Draft — Pending Approval                                                                                             |
| **Last Updated**  | Phase 6 — Development Planning                                                                                       |
| **Depends On**    | PRD.md (v1.2), Architecture.md (v1.1), Database.md (v1.1), UI_UX.md (v1.1), FolderStructure.md (v1.1) — all Approved |
| **Next Document** | Implementation (Phase 7 — actual coding begins, pending your approval of this plan)                                  |

---

## 1. Purpose and Scope

This document translates the five approved design documents into a concrete, incremental implementation roadmap. It defines the order in which the system will be built, how each increment will be tested before the next begins, and the process discipline (branching, commits, pull requests, releases) that keeps a "quality over speed" production build on track, per the PRD's explicit priority.

No application code is included in this document. This is a planning artifact only.

---

## 2. Overall Implementation Roadmap

The build proceeds in **nine sprints**, each nominally one week, organized around the dependency chain established in FolderStructure.md (Types → Schema → Repository → Service → Hook → Components → Route → Tests) applied at the whole-application level: foundational infrastructure and identity first, then the owner's catalog-management tools (since there is nothing for a farmer to browse without them), then the farmer-facing ordering flow, then the order-management loop that connects the two, then polish, hardening, and launch.

```
Sprint 0 — Project Foundation & Environment Setup
Sprint 1 — Authentication & Identity Layer
Sprint 2 — Shop Profile & Category Management (Owner)
Sprint 3 — Product Catalog Management (Owner)
Sprint 4 — Product Discovery & Browsing (Farmer)
Sprint 5 — Cart & Guest Checkout (Farmer)
Sprint 6 — Order Management Loop (Farmer + Owner)
Sprint 7 — Dashboard, Analytics & About-the-Shop
Sprint 8 — PWA Polish, Offline UX, Accessibility & Notification UX
Sprint 9 — Hardening, Full Rules/E2E Coverage & Production Launch
```

Each sprint produces a **deployable, demoable increment** on the staging environment (Architecture.md Section 10.3) — not just code that compiles, but a working slice of the product the shop owner could actually look at, consistent with the PRD's emphasis on building real trust incrementally rather than delivering everything at once at the very end.

---

## 3. Sprint Breakdown

### Sprint 0 — Project Foundation & Environment Setup

**Sprint Goal:** Establish the three Firebase environments, the Next.js project skeleton, CI/CD pipeline, and design-token foundation, so every subsequent sprint has solid ground to build on.

**Deliverables:**

- Three Firebase projects created and configured (`agriconnect-dev`, `agriconnect-staging`, `agriconnect-prod`) per Architecture.md Section 10.3
- Next.js project initialized with TypeScript, Tailwind, Shadcn UI, following the folder structure in FolderStructure.md Section 2
- Design tokens (UI_UX.md Section 17) implemented as Tailwind theme extensions / CSS variables in `src/styles/`
- `src/constants/enums.ts` populated with the shared enums from Database.md Section 12
- Firebase Local Emulator Suite configured and runnable locally
- GitHub Actions CI pipeline scaffolded: lint, type-check, and an (initially empty) test-run step
- `firestore.rules`/`storage.rules` scaffolded with a deny-by-default baseline
- `examples/seed-data/` populated with sample JSON matching Database.md Section 3 schemas

**Dependencies:** None (this is the starting point). Requires Architecture.md, Database.md, FolderStructure.md as direct inputs.

**Acceptance Criteria:**

- A developer can clone the repo, run the emulator suite, and see the Next.js app render a placeholder page with the correct design tokens applied.
- CI runs successfully (green) on a trivial pull request.
- All three Firebase environments exist and are reachable, with billing correctly attached to enable the Blaze plan (Architecture.md Section 10.3).

**Risks:**

- Firebase project/billing setup can involve account-level delays outside engineering control (e.g., waiting on the owner's billing details) — flagged early so it doesn't block Sprint 1.
- Design token implementation drifting from UI_UX.md Section 17 if not directly cross-checked value-by-value.

**Definition of Done:** See Section 8 (applies to every sprint); for Sprint 0 specifically, "done" additionally requires that a second developer can independently reproduce the local dev environment from the README alone.

**Testing Strategy:** No feature tests yet; CI pipeline itself is the testable artifact — verified by intentionally introducing and then fixing a lint error and a type error to confirm the pipeline catches both.

---

### Sprint 1 — Authentication & Identity Layer

**Sprint Goal:** Implement the full three-tier identity model (Anonymous → Phone-linked → Owner) exactly as specified in Architecture.md Section 5, since every other feature depends on knowing "who" is making a request.

> **Implementation note (added post-implementation, Sprint 1 completion):** this sprint was executed as three milestones — 1.1 (shared auth infrastructure: types, repository, context, hooks, protected-route helpers), 1.2 (owner email/password login UI + wiring, combined after determining that splitting UI from execution would require either placeholder logic or an unverifiable UI-only deliverable), and 1.3 (anonymous farmer identity + the phone-credential-linking upgrade primitive). The full phone OTP **UI** (send/verify screens) originally scoped to this sprint is **deferred to Sprint 6** (My Orders / order history, PRD screens F8-F9), where it has a real home — Firebase's phone verification API requires a reCAPTCHA-bound DOM container that cannot meaningfully exist before those screens are built. What Sprint 1 delivers instead is the generic, real, tested `linkPhoneCredentialToCurrentUser()` primitive Sprint 6 will call once verification completes. This was verified directly: attempting to exercise `PhoneAuthProvider.verifyPhoneNumber` in a headless environment throws `auth/operation-not-supported-in-this-environment`, confirming this isn't a schedule shortcut but a genuine platform constraint.

**Deliverables:**

- `features/auth/` complete: silent anonymous sign-in on app load, owner email/password login, and the generic credential-linking primitive that Sprint 6's OTP flow will call
- `owners/{ownerUid}` repository, service, and the owner login route (O1)
- `AuthProvider` context wiring session state app-wide (Architecture.md Section 6.1), including automatic Tier 1 (anonymous) establishment
- Firestore Security Rules covering `owners/{ownerUid}` access only (the one collection fully specified by this sprint's scope)
- Emulator verification of owner login, anonymous sign-in idempotency, and the phone-credential-linking primitive (Database.md Section 7.4)

**Dependencies:** Sprint 0 (project/emulator foundation).

**Acceptance Criteria:**

- A new browser session silently receives an anonymous UID with no visible prompt. ✅ Verified against the live Auth emulator.
- Calling the anonymous sign-in path again on an existing session reuses the same UID rather than creating a new one (session continuity). ✅ Verified.
- The credential-linking primitive preserves the original anonymous UID when upgrading to a phone-linked session (verified using the Auth emulator's test-OTP REST endpoint, bypassing the browser-only reCAPTCHA requirement at the SDK-call level). ✅ Verified.
- The owner can log in with email/password and is correctly routed to a (placeholder) authenticated shell. ✅ Verified, including the wrong-password and non-existent-account error-mapping paths against real emulator error codes.
- An unauthenticated request to read/write `owners/{uid}` for a UID that isn't the requester's own is rejected. ✅ Verified via a hand-run emulator script (a dedicated `tests/rules/` automated suite remains a recommended near-term addition — see Section 9 testing-strategy note).

**Risks:**

- Firebase's anonymous-to-phone credential linking has known edge cases (e.g., re-linking on a new device) — flagged for attention when Sprint 6 implements the actual OTP UI.
- OTP delivery testing requires either real phone numbers or careful emulator configuration — the emulator's test-OTP REST endpoint (confirmed working in this sprint) is the recommended approach for Sprint 6's own testing.

**Definition of Done:** Standard DoD (Section 8), plus: rules tests exist and pass for every access pattern this sprint introduces, per Database.md Section 7.4's mandatory-gate policy.

**Testing Strategy:** Unit tests for auth-related service functions; rules tests for `owners` access; a manual smoke test of the full anonymous → phone-link → owner-login paths against the staging environment (real Firebase Auth, not just the emulator), since Auth's phone-verification behavior is worth confirming outside the emulator at least once before building further on top of it.

---

### Sprint 2 — Shop Profile & Category Management (Owner)

**Sprint Goal:** Give the owner the ability to configure the shop's identity and category structure — the two simplest, most foundational pieces of owner-managed data, and a good first full vertical slice (Types → Schema → Repository → Service → Hook → Components → Route → Tests, per FolderStructure.md's Appendix) to validate the whole pattern before repeating it for products.

**Deliverables:**

- `features/shop-profile/` complete: shop repository/service/hooks, Shop Settings screen (O10), About the Shop screen (F12) rendering real data
- `features/catalog/` categories slice complete: category repository/service/hooks, Category List (O6) and Add/Edit Category (O7) screens
- `CallShopButton` shared component implemented and wired into F12
- Security Rules extended to cover `shops/{shopId}` and `categories` per Database.md Section 7.2
- Rules tests for shop/category public-read, owner-only-write access patterns

**Dependencies:** Sprint 1 (owner authentication must exist before an owner can manage anything).

**Acceptance Criteria:**

- The owner can create/edit the shop profile (name, address, phone, hours, photo) and see it reflected live on the (public, no-login-required) About the Shop screen.
- The owner can create, rename, reorder, and deactivate categories; deactivated categories disappear from any public-facing view (though none exists to verify yet until Sprint 4).
- A non-owner (anonymous session) can read shop/category data but cannot write to it — confirmed by rules tests, not just manual inspection.
- "Call Shop" opens the native dialer with the correct number on a real mobile device test.

**Risks:**

- Image upload (shop photo) introduces the first Storage-rules complexity of the project — worth a focused review against Database.md/Architecture.md's Storage rules principles before merging.

**Definition of Done:** Standard DoD, plus rules tests for all new access patterns (mandatory per Database.md Section 7.4).

**Testing Strategy:** Unit tests for shop/category services (validation rules from Database.md Section 5.2/5.6); integration tests against the emulator for the repositories; rules tests for the new collections; a manual pass of the full Shop Settings → About the Shop flow on an actual Android device to validate the "Call Shop" tel: link and image upload UX.

---

### Sprint 3 — Product Catalog Management (Owner)

**Sprint Goal:** Complete the owner's ability to fully manage the product catalog — the most schema-rich collection in the system, including the multi-image model and availability status.

**Deliverables:**

- `features/catalog/` products slice complete: product repository/service/hooks, Product List (O4), Add/Edit Product (O5)
- Multi-image upload component with drag-to-reorder and cover-image selection (per the image sub-schema in Database.md Section 3.3.1)
- Full product validation per Database.md Section 5.1 (discount ≤ MRP, valid unit/availability enums, category reference validity)
- Security Rules extended to cover `products` per Database.md Section 7.2
- Composite indexes for `products` deployed (Database.md Section 6)

**Dependencies:** Sprint 2 (categories must exist for products to reference).

**Acceptance Criteria:**

- The owner can create a product with multiple images, correctly designate a cover image, set brand/unit/pack size/pricing/availability, and assign it to an existing category.
- Attempting to save a discount price higher than MRP is blocked with a clear inline error (UI_UX.md Section 11).
- Deactivating a product removes it from the (still Sprint-4-pending) farmer view without deleting its underlying data.
- Rules tests confirm public read / owner-only write on `products`, and that a malformed product (e.g., missing required `images` entry) is rejected at the rules layer even if client-side validation were somehow bypassed.

**Risks:**

- This sprint has the highest schema complexity so far (nested image array, multiple enums) — the highest-risk sprint for validation gaps; extra rules-test attention warranted here specifically.
- Image upload performance/UX on a real mid-range Android device should be spot-checked, not just assumed acceptable from desktop testing.

**Definition of Done:** Standard DoD, plus explicit rules-test coverage for every field-level validation rule in Database.md Section 5.1.

**Testing Strategy:** Extensive unit tests on the product Zod schema (every validation rule in Database.md Section 5.1 gets at least one passing and one failing test case); integration tests for image upload/repository behavior; rules tests; manual device testing of the multi-image upload flow specifically.

---

### Sprint 4 — Product Discovery & Browsing (Farmer)

**Sprint Goal:** Deliver the first complete farmer-facing experience — browsing the now-populated catalog — the first sprint where the "guest, no login" experience becomes real and testable end-to-end for reads.

**Deliverables:**

- Farmer route group shell (bottom tab navigation) implemented
- Home (F1), Category Listing (F2), Product Detail (F3), Search Results (F4) complete
- `ProductCard`, `AvailabilityBadge`, `ImageCarousel`, `PriceTag` shared components implemented per UI_UX.md Section 7
- Real-time listeners for products/categories wired via `useProducts`/`useCategories` hooks
- Client-side search/filter over cached listener results (Database.md Section 8, Pattern 2)
- All relevant empty/loading states implemented per UI_UX.md Section 10.1's table

**Dependencies:** Sprint 3 (a populated, correctly-validated product catalog to browse).

**Acceptance Criteria:**

- A brand-new anonymous session can open the app and browse categories → products → product detail with zero login prompts anywhere in this flow.
- Price/availability changes made by the owner (Sprint 3's screens) appear on the farmer's screen without a manual refresh, while the farmer is actively viewing it.
- Every empty state defined in UI_UX.md Section 10.1 for these screens renders with its correct illustration, message, and recovery action.
- Out-of-stock products correctly disable their add-to-cart affordance (cart itself arrives in Sprint 5, so this is validated via a stubbed/disabled state at this point).

**Risks:**

- This is the first sprint tested primarily from the farmer's (public, unauthenticated) perspective — worth an explicit cross-check that no farmer-facing screen accidentally requires a login prompt to render, which would silently violate a core PRD requirement (FR-1).

**Definition of Done:** Standard DoD, plus: a full manual walkthrough of Home → Category → Product Detail is performed on a real Android device on a throttled/simulated 3G connection, confirming the offline-read caching behavior (Architecture.md Section 8.5) degrades gracefully.

**Testing Strategy:** Component tests for `ProductCard`/`AvailabilityBadge` state variants (UI_UX.md Section 18.2/18.5); integration tests confirming the real-time listener reflects an owner-side write; e2e test covering the full browse flow (a first version of `tests/e2e/farmer-checkout.spec.ts`, extended in Sprint 5); manual device testing per the risk above.

---

### Sprint 5 — Cart & Guest Checkout (Farmer)

**Sprint Goal:** Complete the farmer's ability to build a cart and place a Cash-on-Delivery order without any login — the single most business-critical flow in the entire product.

**Deliverables:**

- `features/cart/` complete: `cartStore` (Zustand, Architecture.md Section 6.4), Cart screen (F5) with `QuantityStepper`
- `features/checkout/` complete: Checkout screen (F6) with returning-customer prefill (Database.md Pattern 6), Order Confirmation screen (F7)
- `features/orders/` order-creation slice: order repository/service implementing the atomic batched write (order create + customer upsert, Database.md Section 8's atomicity note) and full creation-time validation (Database.md Section 5.3)
- `notifyOwnerOnNewOrder` Cloud Function deployed (Architecture.md Section 2.2)
- Security Rules extended to cover `orders` (create-only, schema-validated) and `customers` (Database.md Section 7.2)

**Dependencies:** Sprint 4 (farmer must be able to browse and add products before a cart has meaning).

**Acceptance Criteria:**

- A farmer can add products to cart, adjust quantities, proceed to checkout, and place an order entirely as a guest, ending on the Order Confirmation screen with correct order details displayed.
- Placing a second order with the same phone number correctly prefills name/address, with the inline explanatory note per UI_UX.md Section 15.3.
- The owner receives a push notification within a few seconds of order placement (tested against real Firebase Cloud Messaging in staging, not just the emulator).
- A client-side attempt to submit a tampered subtotal (simulated in a rules test, not a real attack) is rejected at the rules layer, confirming Database.md Section 5.3's anti-tampering check.
- Offline checkout correctly blocks with the "no internet" messaging (UI_UX.md Section 12) rather than silently failing or queuing.

**Risks:**

- This sprint carries the highest business risk in the project — a bug here means a real farmer's real order is lost or corrupted. Extra rules-test and manual-QA attention is warranted, and this sprint should not be compressed even under schedule pressure.
- FCM push notification delivery reliability should be verified against a real physical device, since emulator testing cannot fully substitute for confirming real push delivery.

**Definition of Done:** Standard DoD, plus: the full farmer checkout journey (PRD.md Journey A) is manually walked through end-to-end against staging (not the emulator) at least once, including confirming the owner's phone actually receives the push notification.

**Testing Strategy:** Unit tests for the order-creation Zod schema and subtotal-computation logic; integration tests for the atomic batched write; rules tests covering every order-creation validation rule (Database.md Section 5.3) with both valid and deliberately invalid payloads; a completed e2e test for the full guest-checkout journey; manual staging walkthrough per the risk above.

---

### Sprint 6 — Order Management Loop (Farmer + Owner)

**Sprint Goal:** Close the loop between farmer and owner by implementing the full order lifecycle — owner order queue and status management, plus farmer order history and cancellation — completing the core business workflow described in PRD.md Section 7.

**Deliverables:**

- Owner-side: Order Queue (O8), Order Detail with status-advance controls and quantity adjustment (O9), Dashboard's "pending confirmations" widget (a first slice of O2)
- Farmer-side: My Orders phone-entry (F8), OTP verification (F9), Order History list (F10), Order Detail/Status with cancellation (F11)
- `StatusStepper`/`StatusPill` shared components complete (UI_UX.md Section 7/18.5)
- Full order-status-transition validation per Database.md Section 5.4 (valid sequence enforcement, phone-match read/cancel access, append-only `statusHistory`)
- `CancelOrderDialog` confirmation pattern implemented per UI_UX.md Section 21.6

**Dependencies:** Sprint 5 (orders must exist to be managed) and Sprint 1 (phone-linking, needed for farmer order history access).

**Acceptance Criteria:**

- The owner can view the order queue filtered by status, open an order, adjust quantities while still `placed`, and advance it through `confirmed → out_for_delivery → delivered`.
- A farmer can verify their phone via OTP, view their full order history, open an order, and cancel it only while it remains in `placed` status — the cancel action is entirely absent (not merely disabled) once status has advanced, per UI_UX.md Section 5.11's F11 spec.
- Rules tests confirm a farmer cannot read or cancel another farmer's order even with a guessed phone number lacking OTP verification — the core security guarantee this entire identity model exists to provide (Architecture.md Section 5.2).
- Status changes made by the owner are reflected on an actively-open farmer order-detail screen in near real time.

**Risks:**

- This sprint is the second-highest security-risk sprint (after Sprint 5) — the cross-farmer data isolation guarantee is entirely dependent on rules correctness here, not client-side logic, so rules-test thoroughness is non-negotiable before this sprint can close.

**Definition of Done:** Standard DoD, plus: an explicit, deliberate rules-test attempt to read/cancel an order using a phone-linked credential that does _not_ match the order's `customerPhone` must be written and must fail, before this sprint is considered complete.

**Testing Strategy:** Unit tests for status-transition validation logic; rules tests exhaustively covering Database.md Section 7.3's read-access logic (owner full access, phone-matched farmer access, anonymous no-access) in both the "succeeds" and "fails" direction; e2e test covering PRD.md Journey B/C/D (returning farmer order, order history/cancellation, owner order management).

---

### Sprint 7 — Dashboard, Analytics & Remaining Owner Polish

**Sprint Goal:** Complete the owner's daily-operations toolkit — the full dashboard summary and sales analytics — rounding out the owner experience to full PRD scope.

**Deliverables:**

- `features/analytics/` complete: `analyticsService` implementing client-computed aggregation (best-sellers, category breakdown, order-volume trend, new-vs-repeat split) per Database.md Section 9/Architecture.md Section 4.3
- Dashboard (O2) complete with all summary stat cards and low-stock alert panel
- Sales Analytics screen (O3) complete with date-range filtering
- Remaining empty states for O3/O8 per UI_UX.md Section 10.1's table

**Dependencies:** Sprint 6 (meaningful order data must exist to analyze; the dashboard's "pending confirmations" widget from Sprint 6 is extended here rather than rebuilt).

**Acceptance Criteria:**

- The owner can view today's order count, pending confirmations, and a weekly revenue summary on the Dashboard, all reflecting real seeded/test order data accurately.
- Sales Analytics correctly computes best-sellers and category breakdown for a selected date range, cross-checked manually against the underlying seed data for at least one range to confirm calculation correctness.
- Low-stock/out-of-stock products correctly appear in the Dashboard's alert panel and link into the product edit screen (O5).

**Risks:**

- Client-computed analytics correctness is easy to get subtly wrong (e.g., off-by-one date range boundaries, double-counting cancelled orders in revenue) — dedicated unit tests with hand-verified expected outputs are warranted, not just "it renders something."

**Definition of Done:** Standard DoD, plus: at least one analytics calculation is independently hand-verified against raw seed data and matches exactly, not just "looks reasonable."

**Testing Strategy:** Unit tests for every analytics aggregation function using known seed data with hand-calculated expected results; component tests for the Dashboard's stat cards and alert panel; manual review of the Sales Analytics screen against the seed dataset.

---

### Sprint 8 — PWA Polish, Offline UX, Accessibility & Notification UX

**Sprint Goal:** Elevate the now-functionally-complete application to full production polish across the cross-cutting concerns specified in UI_UX.md — PWA installability, offline handling, accessibility, micro-interactions, and the notification system — since these were deliberately deferred from earlier feature-focused sprints rather than being retrofitted piecemeal.

**Deliverables:**

- Service worker (Workbox) configured for app-shell precaching and stale-while-revalidate catalog/image caching (Architecture.md Section 8)
- PWA install-prompt flow implemented per UI_UX.md Section 13 (contextual timing after first order, Shop Settings install option for owner)
- Full micro-interactions pass per UI_UX.md Section 20 (add-to-cart animation, quantity-change feedback, skeleton shimmer, success animations, pull-to-refresh, button press feedback)
- Full notification UX pass per UI_UX.md Section 21 (snackbar system, offline banner, confirmation dialogs standardized across all destructive actions)
- Accessibility checklist (UI_UX.md Section 19) audited and remediated across every screen: touch targets, keyboard navigation (owner console), screen reader labels, focus management, color contrast, error announcements

**Dependencies:** Sprints 0–7 (this sprint polishes and cross-cuts the now-complete feature set rather than introducing new business logic).

**Acceptance Criteria:**

- Lighthouse (or equivalent) PWA audit passes installability and basic performance checks.
- A manual accessibility pass using a screen reader (e.g., TalkBack on Android) confirms product browsing and checkout are operable, per UI_UX.md Section 19.3.
- Keyboard-only navigation is confirmed functional throughout the Owner console (UI_UX.md Section 19.2).
- All color/background combinations pass the 4.5:1 contrast check specified in UI_UX.md Section 19.6, including tinted badge backgrounds specifically.
- The install prompt appears at the correct contextual moment (post-first-order) and not before.

**Risks:**

- Accessibility remediation discovered late can require component-level rework if earlier sprints didn't build with the design tokens/patterns correctly from the start — mitigated by the fact that Sections 2.2/18/19 of UI_UX.md were already referenced throughout Sprints 2–7's component work, so this sprint should surface gaps rather than wholesale rework.

**Definition of Done:** Standard DoD, plus a documented accessibility audit checklist (UI_UX.md Section 19's six subsections) with each item explicitly checked off against the real, deployed staging build.

**Testing Strategy:** Automated Lighthouse/axe-core accessibility scans integrated into CI going forward from this sprint onward; manual screen-reader and keyboard-only testing passes; manual device testing of all micro-interactions and the install flow.

---

### Sprint 9 — Hardening, Full Rules/E2E Coverage & Production Launch

**Sprint Goal:** Final production-readiness pass — comprehensive security rules audit, full end-to-end regression coverage, performance validation at expected scale, and the actual production launch.

**Deliverables:**

- Full Firestore/Storage Security Rules test suite covering every access pattern in Database.md Section 7.2/7.3, with both success and failure cases for each (final completeness pass, not just per-sprint incremental coverage)
- Complete e2e test suite covering all six PRD.md user journeys (Journeys A–F) end-to-end
- App Check (Architecture.md Section 12) enabled and verified in staging
- Load/scale sanity check against expected V1 volumes (Architecture.md Section 9): seeded with representative data at the upper end of expected scale (500 farmers' worth of customer records, 300 products, a few thousand historical orders) to confirm pagination and query performance remain acceptable
- Production Firebase project (`agriconnect-prod`) fully configured, billing confirmed, and a real (not sample) shop profile entered by the actual owner
- Final manual acceptance walkthrough with the shop owner directly, using the real production environment

**Dependencies:** All prior sprints.

**Acceptance Criteria:**

- 100% of the access patterns catalogued in Database.md Section 7.2/7.3 have a passing rules test in both directions.
- All six PRD user journeys pass as automated e2e tests against staging.
- The owner has personally walked through creating his real catalog, receiving a real test order, and managing it to `Delivered` in the production environment, and confirms it matches his expectations.
- No known Critical or High severity defects remain open (per the Definition of Done's severity classification, Section 8).

**Risks:**

- Owner acceptance testing may surface late usability feedback that wasn't apparent in earlier internal testing — a short buffer for minor adjustments should be planned within this sprint rather than assuming zero findings.
- Real-world OTP/SMS delivery and FCM push reliability in production (as opposed to staging) should be explicitly reconfirmed, since staging and production are separate Firebase projects with independent quotas/configuration.

**Definition of Done:** Standard DoD, plus: explicit written owner sign-off following the final acceptance walkthrough, and a tagged `v1.0.0` release (Section 12).

**Testing Strategy:** This sprint is testing-strategy-as-deliverable — see Section 9 for the full per-sprint testing strategy summary and Section 12 for release-gate criteria specifically.

---

## 4. Sprint Goals Summary Table

| Sprint | Goal (One Line)                                                                      |
| ------ | ------------------------------------------------------------------------------------ |
| 0      | Stand up infrastructure, environments, and CI so every later sprint has solid ground |
| 1      | Implement the three-tier identity model everything else depends on                   |
| 2      | Owner can configure shop identity and categories                                     |
| 3      | Owner can fully manage the product catalog                                           |
| 4      | Farmer can browse the catalog with zero login                                        |
| 5      | Farmer can build a cart and place a guest COD order                                  |
| 6      | Owner and farmer can manage an order through its full lifecycle                      |
| 7      | Owner has a working dashboard and sales analytics                                    |
| 8      | The app is polished, accessible, installable, and production-feeling                 |
| 9      | The app is fully hardened, tested, and launched                                      |

---

## 5. Cross-Sprint Dependency Map

```
Sprint 0 (Foundation)
   │
   ▼
Sprint 1 (Identity) ──────────────┐
   │                              │
   ▼                              │
Sprint 2 (Shop + Categories)      │
   │                              │
   ▼                              │
Sprint 3 (Products)               │
   │                              │
   ▼                              │
Sprint 4 (Farmer Browsing)        │
   │                              │
   ▼                              │
Sprint 5 (Cart + Checkout) ◄──────┘  (needs phone-linking from Sprint 1)
   │
   ▼
Sprint 6 (Order Management Loop) ◄── (needs phone-linking from Sprint 1)
   │
   ▼
Sprint 7 (Dashboard + Analytics)
   │
   ▼
Sprint 8 (Polish / Accessibility / PWA)
   │
   ▼
Sprint 9 (Hardening + Launch)
```

This confirms the plan's linear structure is intentional, not accidental: each sprint's acceptance criteria genuinely require the previous sprint's deliverables to exist, minimizing rework from building features out of dependency order.

---

## 6. Risks (Project-Wide, Beyond Per-Sprint Risks)

| Risk                                                                                                                     | Likelihood | Impact | Mitigation                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schedule pressure compresses Sprint 5 or 6 (the two highest-risk, order-integrity-critical sprints)                      | Medium     | High   | Explicitly flagged in this plan as non-compressible; if schedule slips, extend the timeline rather than cut testing scope in these two sprints specifically                                                          |
| Owner unavailable for timely feedback/acceptance testing (Sprint 9, and informal check-ins throughout)                   | Medium     | Medium | Schedule brief owner check-ins at the end of Sprints 2, 4, 6, and 7 — the points where a demoable, owner-relevant increment exists — rather than waiting until Sprint 9 for the first real feedback                  |
| Firebase Free/Blaze tier usage exceeds projections during testing (e.g., heavy manual QA generating excess reads/writes) | Low        | Low    | Development/staging testing primarily against the Local Emulator Suite (free, unlimited); real Firebase usage reserved for the smaller number of manual staging/production verification passes called out per sprint |
| Rules-test coverage gaps only discovered in Sprint 9 rather than incrementally                                           | Medium     | High   | Mitigated structurally: every sprint's Definition of Done (Section 8) requires rules tests for that sprint's new access patterns — Sprint 9 audits completeness, it does not originate coverage from scratch         |
| Telugu/multi-language or other future-scope work creeping into V1 sprints                                                | Low        | Medium | This plan scopes strictly to PRD.md v1.2's approved V1 functional requirements; any such creep should be explicitly flagged and deferred, not quietly absorbed into a sprint's scope                                 |

---

## 7. Acceptance Criteria (Project-Wide)

Beyond each sprint's specific acceptance criteria (Section 3), the following apply to the project as a whole before Sprint 9 can be considered complete:

- Every functional requirement in PRD.md Section 4 (FR-1 through FR-33) is implemented and demonstrably working in the production environment.
- Every non-functional requirement in PRD.md Section 5 has been explicitly verified, not assumed (e.g., performance on a throttled connection, offline read behavior, PWA installability).
- Every edge case catalogued in PRD.md Section 8 has either a corresponding test case or a documented manual verification note.
- Every security-rule access pattern in Database.md Section 7.2/7.3 has passing automated tests in both the "succeeds" and "fails" direction.
- The shop owner has personally used the production system to manage at least one real or realistic end-to-end order and has signed off.

---

## 8. Definition of Done

A task, feature, or sprint is considered **Done** only when all of the following are true — this is a project-wide standard, referenced by every sprint in Section 3 rather than repeated in full each time:

1. **Code complete** and merged to the appropriate branch (Section 10) via an approved pull request (Section 11).
2. **Type-checked and linted** with zero errors, per the CI pipeline established in Sprint 0.
3. **Unit tests** written and passing for all business logic (services, schemas, utility functions) introduced.
4. **Integration tests** written and passing for any new repository-layer Firestore/Storage access, against the Local Emulator Suite.
5. **Security Rules tests** written and passing — both success and failure cases — for any new or changed Firestore/Storage access pattern (Database.md Section 7.4's mandatory gate; no exceptions).
6. **Matches the approved design documents.** The implementation is checked against PRD.md's relevant functional requirement(s), Database.md's schema/validation rules, and UI_UX.md's screen/component specification — deviations are flagged and discussed, not silently implemented differently.
7. **No known Critical or High severity defects.** (Critical: data loss, security/data-isolation failure, or a core user journey completely blocked. High: a core user journey significantly degraded but has a workaround. Medium/Low severity issues may be explicitly deferred with a tracked follow-up item, at the team's judgment.)
8. **Deployed to staging** and manually smoke-tested at least once for the specific feature delivered.
9. **Documentation updated** where relevant — if an implementation detail deviates from or extends what's described in the five design documents, that document is updated to reflect reality (keeping the documentation-and-code relationship accurate over time, consistent with the rigor established throughout this design process).

---

## 9. Testing Strategy Per Sprint (Summary)

| Sprint | Primary Testing Focus                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | CI pipeline correctness (lint/type-check gates)                                                                                                       |
| 1      | Auth flow correctness (unit + rules + manual staging smoke test)                                                                                      |
| 2      | Shop/category service validation, rules tests, manual device check of Call Shop/image upload                                                          |
| 3      | Exhaustive product schema validation (unit + rules), manual multi-image upload device check                                                           |
| 4      | Component state tests, real-time listener integration tests, e2e browse flow, throttled-connection manual check                                       |
| 5      | Order-creation validation and anti-tampering rules tests, atomic-write integration tests, full e2e checkout, manual staging walkthrough with real FCM |
| 6      | Exhaustive order-lifecycle and cross-farmer-isolation rules tests, e2e order-management journeys                                                      |
| 7      | Hand-verified analytics calculation unit tests                                                                                                        |
| 8      | Automated accessibility/Lighthouse scans, manual screen-reader and keyboard testing                                                                   |
| 9      | Full rules-suite completeness audit, full e2e journey suite, load/scale sanity check, owner acceptance testing                                        |

This progression deliberately front-loads **security and data-integrity testing** (Sprints 1, 3, 5, 6 — everywhere Firestore Rules are introduced or extended) rather than treating testing as a single end-of-project phase, consistent with the mandatory per-sprint rules-testing gate established in the Definition of Done.

> **Implementation note (added post-Sprint 1):** rules verification in Sprint 1 was performed via hand-run emulator scripts (proving both allowed and denied access patterns against the live Auth/Firestore emulators), not an automated `tests/rules/` suite integrated into CI. A dedicated automated rules-testing framework (`vitest` + `@firebase/rules-unit-testing`, per FolderStructure.md Section 12) is recommended as a near-term addition — ideally at the start of Sprint 2, before the number of collections with real rules grows further — so that rules regressions are caught by CI on every PR rather than relying on manual verification each sprint.

---

## 10. Git Branching Strategy

A **trunk-based development with short-lived feature branches** model is used, chosen for its simplicity at this team size and its compatibility with the staged-deployment CI/CD pipeline already established in Architecture.md Section 10.2:

- **`main`** — always deployable to staging automatically on merge (Architecture.md Section 10.2); this is the trunk.
- **`feature/{sprint-number}-{short-description}`** branches — e.g., `feature/3-product-image-upload` — created from `main`, short-lived (ideally merged within a few days), and deleted after merge.
- **`release/{version}`** branches — created only at the point of a production release (Section 12), allowing any last-minute production-only fixes to be cherry-picked without pausing ongoing `main` development.
- **`hotfix/{short-description}`** branches — created directly from the relevant `release/` branch (or `main`, if no divergence exists) for urgent production fixes, merged back into both the release branch and `main`.

No long-lived `develop` branch is used — at this project's scale, an additional integration branch would add process overhead without a corresponding benefit, since `main` itself is kept continuously deployable to staging.

---

## 11. Commit Conventions

**Conventional Commits** format is used throughout, chosen for its readability and compatibility with automated changelog generation if adopted later:

```
<type>(<scope>): <short summary>

[optional longer body]

[optional footer, e.g., "Closes #123"]
```

| Type       | Used For                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat`     | A new feature or capability                                                                                                                                         |
| `fix`      | A bug fix                                                                                                                                                           |
| `test`     | Adding or updating tests only                                                                                                                                       |
| `docs`     | Documentation-only changes (including updates to the five design documents themselves)                                                                              |
| `refactor` | Code change that neither fixes a bug nor adds a feature                                                                                                             |
| `chore`    | Tooling, dependency, or config changes with no production code impact                                                                                               |
| `rules`    | Firestore/Storage Security Rules changes specifically — called out as its own type given how central rules correctness is to this project (Database.md Section 7.4) |

**Scope** corresponds to the feature folder affected (Section 3 of FolderStructure.md) — e.g., `feat(orders): add cancellation flow for placed orders`, `rules(products): restrict write access to shop owner`.

---

## 12. Pull Request Checklist

Every pull request must confirm the following before requesting review, and the reviewer re-confirms before approving:

- [ ] Branch is up to date with `main` and CI is green (lint, type-check, all test suites)
- [ ] Change is scoped to a single feature/concern (per FolderStructure.md's feature-boundary rules) — no unrelated changes bundled in
- [ ] Unit tests added/updated for any new or changed business logic
- [ ] Integration tests added/updated for any new or changed repository-layer access
- [ ] **Security Rules tests added/updated for any new or changed Firestore/Storage access pattern — both success and failure cases** (non-negotiable per Database.md Section 7.4 and this plan's Definition of Done)
- [ ] Implementation matches the relevant PRD functional requirement(s), Database.md schema, and UI_UX.md screen/component spec — any intentional deviation is called out explicitly in the PR description
- [ ] No new `console.log`/debug artifacts, no commented-out code left behind
- [ ] No secrets, API keys, or environment-specific config committed
- [ ] Module boundary rules respected (FolderStructure.md Section 11) — no cross-feature internal imports, no layer-skipping
- [ ] Manually smoke-tested against a local emulator or staging deploy, with a brief note in the PR description of what was checked
- [ ] Relevant design document updated if the implementation revealed a needed correction or extension (Section 8, point 9)

---

## 13. Release Milestones

| Milestone      | Corresponds To  | Description                                                                                                                                      |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v0.1.0-alpha` | End of Sprint 1 | Identity layer functional; internal-only, no visible product yet                                                                                 |
| `v0.2.0-alpha` | End of Sprint 3 | Owner can fully manage shop/categories/products; internal demo-ready for the owner's first look                                                  |
| `v0.3.0-alpha` | End of Sprint 5 | End-to-end guest ordering functional; first milestone genuinely usable by a real farmer in a controlled test                                     |
| `v0.4.0-beta`  | End of Sprint 6 | Full order lifecycle functional both directions; candidate for a small real-world pilot with the actual shop owner and a handful of real farmers |
| `v0.5.0-beta`  | End of Sprint 7 | Full feature scope per PRD.md complete; owner has full daily-operations tooling                                                                  |
| `v0.9.0-rc`    | End of Sprint 8 | Production-polish complete; release candidate for final hardening                                                                                |
| `v1.0.0`       | End of Sprint 9 | Full production launch, owner sign-off obtained, all acceptance criteria (Section 7) met                                                         |

Each milestone is tagged in git and deployed to `agriconnect-staging` at minimum; `v1.0.0` specifically is the first and only milestone deployed to `agriconnect-prod` for real shop/farmer use, consistent with the strict environment isolation established in Architecture.md Section 10.3 — no earlier milestone touches production data.

---

**Document Status:** Draft, pending your review and approval. No application code has been generated as part of this document, per instruction. Upon your approval, implementation (Sprint 0) is the next step.
