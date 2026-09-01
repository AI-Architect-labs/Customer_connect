# Product Requirements Document

## AgriConnect — Online Ordering Platform for Local Agricultural Shops

**Version:** 1.2 (Final — Approved)
**Status:** Approved
**Document Owner:** Principal Architect / Product Design Phase

---

## 1. Business Overview

AgriConnect is an online ordering platform that digitizes a local agricultural products shop (fertilizers, seeds, pesticides, tools, micronutrients), allowing farmers to browse products, check prices and discounts, and place Cash-on-Delivery (COD) orders without visiting the shop in person or creating an account. The shop owner manages the product catalog and fulfills orders through existing manual delivery processes.

The immediate goal is to help one local shop compete with larger retailers and online agri-commerce platforms by offering a simple, frictionless, mobile-friendly ordering experience — without requiring the shop owner to pay anything, and without requiring farmers to sign up or log in to place an order.

The platform is architected as **multi-tenant-ready from day one** (every record scoped to a shop), even though only one shop will use it initially. This is a deliberate architectural decision, not a deferred feature — it means onboarding a second shop later requires no data migration or structural redesign.

**What this is not (V1 scope boundaries):**

- Not a payment platform (Cash on Delivery only)
- Not a logistics/delivery-tracking platform
- Not a multi-shop marketplace (yet)
- Not a subscription or commission-based product (yet)
- Not an account-based system for farmers (guest checkout by design)

---

## 2. Goals

### Business Goals

- Provide a zero-cost digital storefront that reduces phone-call and in-person order friction for the shop owner
- Build trust in the system so the owner adopts it as a primary order channel within 2–3 months
- Establish an architecture that can scale to multiple shops and thousands of users without a rewrite

### Product Goals

- A farmer can go from opening the app to placing an order in under 2 minutes, with **zero signup**
- The owner can manage catalog, orders, and basic sales insight without technical assistance
- No ambiguity in order status for either the owner or the farmer at any point

### Non-Goals (Explicitly Out of Scope for V1)

- Online payments
- Delivery tracking or logistics optimization
- Multi-shop marketplace UX
- WhatsApp / AI integrations
- Farmer accounts or login-based identity

---

## 3. User Personas

### Persona 1: Ramulu — The Shop Owner

- 45 years old, has run a local agricultural supply shop for 15+ years
- Moderately tech-comfortable (uses WhatsApp, banking apps) but not a power user
- Currently takes orders via phone calls and in-person visits
- Wants: fewer interruptions, clear visibility into orders, control over his catalog and prices, basic sales insight, all at zero cost
- Frustration: losing customers to bigger stores and online platforms; can't always be reached when a farmer wants to check stock or price

### Persona 2: Venkaiah — The Farmer

- 30–55 years old, owns or works a small-to-medium farm
- Uses a basic Android smartphone; comfortable with WhatsApp and calling, but limited patience for signup/login flows; may have limited reading ability in English
- Wants: to check prices and availability, order without traveling to the shop, and pay only when goods arrive
- Frustration: doesn't want to navigate complex apps, create accounts, or trust an app with anything beyond his name, phone number, and address

### Persona 3 (Secondary, Future-Facing): Lakshmi — A Second Shop Owner

- Not present in V1, but the data model must support her shop being onboarded later without migration or redesign

---

## 4. Functional Requirements

### 4.1 Farmer Identity (Guest Checkout Model)

- **FR-1:** Farmers do not need to log in to browse products, add items to cart, or place an order
- **FR-2:** At checkout, the farmer enters name, phone number, and address (village/area, landmark, free-text)
- **FR-3:** The system looks up the phone number against existing customer records; if found, it prefills name and address for the farmer to confirm or edit (returning-customer convenience)
- **FR-4:** To view past order history or cancel an order, the farmer enters their phone number and receives a one-time 4-digit OTP — a lightweight verification step, not a full account/login system — before order history or cancellation is permitted. This exists solely to prevent one farmer from viewing or cancelling another farmer's order by guessing a phone number.
- **FR-5:** No password, profile, or persistent account is required at any point for browsing or placing orders

### 4.2 Product Catalog (Owner)

- **FR-6:** Owner can create, edit, and delete products with: name, brand, category, description, multiple images, unit type (kg / litre / piece / packet), pack size, MRP, discounted price (optional), and availability status
- **FR-7:** Availability status is a simple owner-set field with three values — `Available`, `Low Stock`, `Out of Stock` — displayed as a prominent badge on product cards, independent of exact stock count
- **FR-8:** Owner manages configurable categories (create, rename, reorder, deactivate) — categories are not hardcoded and can be freely defined by the owner (e.g., Fertilizers, Seeds, Pesticides, Tools, Micronutrients, or new categories added later)
- **FR-9:** Owner can upload multiple images per product; the first image serves as the default/cover image shown in listings
- **FR-10:** Owner can mark a product `Out of Stock` without deleting it from the catalog

### 4.3 Product Discovery (Farmer)

- **FR-11:** Farmer can browse products by owner-configured category
- **FR-12:** Farmer can search products by name or brand
- **FR-13:** Farmer can view product detail: swipeable image gallery, brand, price, discount, unit/pack size, and availability status
- **FR-14:** All listings use large tap targets, image-first cards, and minimal text

### 4.4 Cart & Ordering (Farmer — Guest)

- **FR-15:** Farmer can add/remove products and adjust quantities in cart; cart persists locally on the device without requiring login
- **FR-16:** At checkout, farmer provides name, phone number (with returning-customer prefill per FR-3), and address/village/landmark
- **FR-17:** Farmer confirms the order as **Cash on Delivery** — the only supported payment mode
- **FR-18:** Farmer sees an on-screen confirmation: "Order Placed — Shop owner will confirm shortly"
- **FR-19:** Farmer can cancel an order only while its status is `Placed`, using OTP verification (FR-4) to confirm it is their own order
- **FR-20:** Farmer can view their full order history (all past orders tied to their phone number) after OTP verification (FR-4)

### 4.5 Order Management (Owner)

- **FR-21:** Owner receives a push notification (via Firebase Cloud Messaging) immediately when a new order is placed
- **FR-22:** Owner sees an order queue showing farmer name, phone number, items, quantities, address, and current status
- **FR-23:** Owner can move orders through the lifecycle: `Placed → Confirmed → Out for Delivery → Delivered`, or mark an order `Cancelled` (with a reason) from `Placed` or `Confirmed`
- **FR-24:** Owner can adjust item quantities during confirmation (e.g., in case of partial stock availability) before confirming the order
- **FR-25:** Status changes are visible to the farmer in near-real-time when they check their order status or history

### 4.6 Owner Dashboard (with Sales Analytics)

- **FR-26:** Dashboard shows today's order count, pending confirmations, and a weekly order/revenue summary
- **FR-27:** Dashboard flags low-stock and out-of-stock products
- **FR-28:** Dashboard includes sales analytics: best-selling products (by quantity and revenue), sales breakdown by category, order volume trend (daily/weekly/monthly), and a new-vs-repeat customer split (based on phone number recurrence)
- **FR-29:** Owner can filter analytics by date range (e.g., today / this week / this month)

### 4.7 About the Shop

- **FR-30:** A dedicated "About the Shop" section is visible to all farmers, displaying: Shop Name, Owner Name, Shop Photo, Address, Phone Number, and Business Hours
- **FR-31:** The section includes a placeholder/future-ready field for a Google Maps location, not required to be functional in V1
- **FR-32:** A prominent **"Call Shop"** button is available (on the About the Shop section and, optionally, elsewhere in the farmer experience) that initiates a direct phone call to the shop, allowing farmers to ask questions before placing an order

### 4.8 Localization Readiness

- **FR-33:** All user-facing text is sourced from a translation-ready (i18n) structure; English only in V1, with the architecture ready for Telugu localization in a future version

---

## 5. Non-Functional Requirements

| Category               | Requirement                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Performance**        | Product listing and cart interactions should feel instant (under 1 second) on mid-range Android devices over 3G/4G connections                                                        |
| **Usability**          | Large tap targets (minimum 44px), minimal text density, image-led navigation; guest checkout completable in as few screens as possible                                                |
| **Availability**       | Firebase-hosted; target 99%+ uptime                                                                                                                                                   |
| **Scalability**        | Data model designed so scaling to multiple shops or thousands of users requires no schema redesign                                                                                    |
| **Security**           | Farmer order history and cancellation require OTP-based phone verification to prevent cross-farmer data access; owner access is role-restricted and shop-scoped                       |
| **Cost**               | Designed to remain within the Firebase Free Tier at current expected scale wherever possible; usage thresholds that would trigger paid-tier costs are documented                      |
| **Maintainability**    | TypeScript throughout, component-driven UI (Shadcn), clear separation between data access and UI layers                                                                               |
| **Offline Resilience** | Catalog browsing remains available (cached) on flaky connections; placing an order requires connectivity, with clear "no internet" messaging; duplicate order submission is prevented |
| **Installability**     | Installable as a Progressive Web App on Android home screens; architecture compatible with a future native Android/iOS wrap                                                           |
| **Data Portability**   | Owner's product, order, and analytics data is reviewable and exportable, avoiding vendor lock-in concerns                                                                             |

---

## 6. User Journeys

### Journey A: Farmer places a first order (no signup)

1. Opens the app — sees categories and products, with no login prompt anywhere
2. Optionally checks "About the Shop" or taps "Call Shop" if they have questions
3. Browses a category (e.g., Fertilizers) and taps a product to view images, brand, price, and availability
4. Adds the product to cart, adjusts quantity, proceeds to checkout
5. Enters name, phone number, and address (no prefill, as this is a first-time order) and confirms the order as Cash on Delivery
6. Sees an on-screen "Order Placed" confirmation
7. Owner calls to confirm availability and delivery details (off-app, business as usual)
8. Farmer later checks status and sees it move through `Confirmed → Out for Delivery → Delivered`

### Journey B: Returning farmer places a second order

1. Browses and adds items to cart as before
2. At checkout, enters their phone number — name and address auto-fill from their prior order
3. Confirms or edits the prefilled details, then places the order via the same COD flow

### Journey C: Farmer checks order history or cancels an order

1. Taps "My Orders," enters their phone number, and receives an OTP
2. After verification, views their list of past orders and current statuses
3. If an order is still in `Placed` status, can cancel it directly from this screen

### Journey D: Owner manages a day's orders

1. Receives a push notification: "New order — 2 items"
2. Reviews the order, calls the farmer to confirm availability, adjusts quantity if needed, and marks it `Confirmed`
3. Delivers the order physically, then marks it `Delivered`
4. Checks the dashboard for today's order count and any low-stock flags

### Journey E: Owner reviews sales analytics

1. Opens the Dashboard's Analytics tab
2. Filters to "This Month" and reviews best-selling products, category breakdown, order volume trend, and new-vs-repeat customer split
3. Uses these insights to prioritize restocking

### Journey F: Owner updates the catalog

1. Adds a new product with name, brand, category (from the owner's configurable list, or a newly created category), multiple images, unit, MRP, and discount
2. Sets its availability status
3. Product becomes visible to farmers immediately

---

## 7. Business Workflow (Order Lifecycle)

```
Farmer places order (guest checkout)
        ↓
   [Placed] ──(farmer can cancel via OTP-verified request)──→ [Cancelled]
        ↓
Owner reviews & calls farmer (off-app) to confirm availability
        ↓
   [Confirmed] ──(owner can cancel, e.g. stock issue)──→ [Cancelled]
        ↓
Owner delivers physically
        ↓
   [Out for Delivery]
        ↓
   [Delivered]  ← terminal state
```

This workflow deliberately keeps a human-confirmation checkpoint between "farmer intent" and "committed order," since exact inventory accuracy can't be guaranteed and Cash on Delivery orders carry no upfront financial commitment from the farmer.

---

## 8. Edge Cases

| Edge Case                                                                               | Handling                                                                                                                               |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Same phone number used by two different farmers (shared family phone)                   | Prefilled details are shown as a suggestion, not locked — farmer can overwrite name/address at checkout                                |
| Farmer enters an incorrect phone number at checkout                                     | Order still processes (no verification required to place an order); owner discovers any mismatch when calling to confirm               |
| Someone attempts to view another farmer's order history via a guessed phone number      | Blocked by the OTP verification requirement (FR-4/FR-20)                                                                               |
| Inventory shown in-app diverges from actual physical stock (e.g., due to walk-in sales) | Owner-set availability status and the confirmation call step act as the safety net; exact stock count is treated as a soft signal only |
| Owner deletes a product that was part of a past order                                   | Product is soft-deleted (deactivated, not removed), so historical order data remains intact                                            |
| Farmer wants to change their address after placing an order                             | Allowed only while status is `Placed`; after `Confirmed`, the farmer must contact the owner directly                                   |
| Multiple images uploaded but one fails to upload                                        | Product still saves with the remaining valid images; owner can retry the failed upload                                                 |
| Owner attempts to create a duplicate category name                                      | Validation warns or prevents the exact duplicate                                                                                       |
| Owner sets a discounted price higher than the MRP                                       | Validation blocks the save with an inline error                                                                                        |
| Farmer loses connectivity mid-checkout                                                  | Cart persists locally; order submits only once connectivity is restored; duplicate submissions are prevented                           |

---

## 9. Future Enhancements

- Multi-shop support with shop discovery for farmers
- Subscription or commission-based monetization for shop owners
- WhatsApp order notifications and confirmations
- Online payment integration (UPI/cards)
- Delivery tracking and delivery-partner assignment
- Telugu (and other regional language) localization
- Functional Google Maps integration for shop location
- **AI-based crop recommendations** — suggesting fertilizers/products based on crop type, season, or region
- **AI chatbot assistance** — conversational product discovery and order help (e.g., "What should I use for paddy this season?"), potentially voice-enabled in Telugu
- Loyalty and repeat-customer pricing, bulk-order discounts
- CSV/bulk product upload for larger catalogs
- Native Android/iOS apps built on the same core architecture

---

## 10. Risks

| Risk                                                                                                | Type          | Mitigation                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest checkout allows typos or fake phone numbers                                                   | Data Quality  | Owner's confirmation call catches this before commitment; an acceptable trade-off for frictionless ordering                                     |
| Owner doesn't check the app regularly, causing orders to go stale                                   | Adoption      | Push notifications on new orders are included in V1, not deferred                                                                               |
| In-app inventory diverges from real stock                                                           | Product/Trust | Availability status plus the confirmation step mitigate this; documented as a known limitation, not a defect                                    |
| Farmers distrust digital ordering and prefer calling directly                                       | Adoption      | Radically simple, no-signup flow; Cash on Delivery removes the financial trust barrier; "Call Shop" button preserves a direct line to the owner |
| Returning-customer prefill shows stale data if a phone number is reused by a different person later | Data Quality  | Farmer can always overwrite prefilled fields at checkout                                                                                        |
| OTP-based verification adds friction back into an otherwise no-login product                        | UX            | Scoped narrowly to order history and cancellation only — never required to browse or place an order                                             |
| Firebase Free Tier limits are exceeded as usage grows                                               | Cost          | Usage is monitored against Firebase's free-tier quotas; upgrade trigger points are documented in advance                                        |
| Firestore security rules are misconfigured, exposing cross-farmer or cross-shop data                | Security      | Rules are explicitly scoped and tested before launch                                                                                            |
| Owner's catalog/category management becomes burdensome without bulk tools                           | Operational   | Acceptable at the current scale of 50–300 products; CSV import is deferred to a future enhancement                                              |

---

## 11. Success Metrics

### Adoption

- Percentage of the shop's regular customers placing at least one order via the app within 3 months
- Percentage of orders from returning (prefilled) phone numbers versus new numbers

### Operational Health

- Percentage of orders confirmed by the owner within 2 hours of placement
- Percentage of orders reaching `Delivered` status versus abandoned or cancelled

### Product Usability

- Average time from app open to order placement (target: under 2 minutes, with no signup required)
- Cart abandonment rate at checkout

### Technical Health

- App usage remains within the Firebase Free Tier for at least the first 6 months at expected scale
- Zero incidents of unauthorized cross-farmer or cross-shop data access

### Business Impact (Qualitative)

- Owner-reported reduction in phone-call order volume
- Owner's use of sales analytics to inform restocking and purchasing decisions
- Owner's willingness to recommend the platform to other shop owners (an early signal for future multi-shop expansion)

---

**Document Status:** Approved. This PRD reflects the complete, final set of agreed requirements for AgriConnect Version 1. All subsequent architecture and engineering decisions should trace back to this document.
