# Implementation & Security Addendum

## Status

Implementation-time refinement to the approved PRD/Architecture/Database documents. It records deliberate changes discovered while turning the design into a production system; it does not silently rewrite the original documents.

## 1. Owner routes use `/owner/*`

The design documents used Next.js route groups to conceptually separate Farmer and Owner experiences. Route groups do **not** contribute URL segments, so defining both farmer `/categories` and owner `/categories` would create a real route collision. The implementation therefore uses:

- Farmer: `/categories`, `/orders`, etc.
- Owner: `/owner/categories`, `/owner/orders`, `/owner/products`, `/owner/settings`, `/owner/dashboard`.
- Owner login remains `/login`.

This preserves the UX while making the route graph valid and explicit.

## 2. Owner mappings are Admin-provisioned

The earlier Sprint-1 implementation allowed an owner to write their own `owners/{uid}` document. That would allow an arbitrary authenticated Firebase account to claim `role: owner` and a `shopId` if exposed in production.

Production rule: client writes to `owners/{uid}` are denied. The initial owner mapping is created via Firebase Admin using `scripts/bootstrap_owner.py`. Future staff onboarding must also use a trusted server/Admin workflow.

## 3. Order writes moved to trusted Cloud Functions

The original data design contemplated anonymous client order creation guarded by Firestore Rules, including subtotal validation. Firestore Rules cannot safely and ergonomically recalculate an arbitrary cart from live product documents, and trusting client-supplied `unitPrice` is unacceptable.

Production implementation:

- Client sends only product IDs + quantities + delivery details to `createOrder` callable Function.
- Function reloads products using Admin SDK.
- Function rejects inactive/out-of-stock products.
- Function computes authoritative unit prices and subtotal.
- Order and customer upsert are written atomically.
- Firestore rules deny direct client create/update/delete on `orders` and `customers`.

This is stricter than the original rules model and removes the most important price-tampering risk.

## 4. Order lifecycle mutations are server-authoritative

Owner status transitions/quantity adjustments and farmer cancellation use callable Functions. The Functions validate ownership/phone identity, allowed lifecycle transitions, and append audit history before writing through Admin SDK.

## 5. Customer prefill privacy refinement

The PRD requires returning-customer prefill using phone number but does not require OTP at checkout. Returning a stored address to anyone who can guess a phone number would expose personal delivery data.

`getCheckoutPrefill` returns saved details only when either:

- the current Firebase session matches the customer record's original/recent anonymous UID (same persistent browser identity), or
- the session is phone-verified for that phone number.

The browser also stores the last checkout profile locally for convenience. This preserves low-friction repeat ordering without making customer records publicly queryable.

## 6. Abuse controls

`createOrder` applies an Admin-side per-UID order rate limit (10 submissions per 15-minute window). Firebase App Check client integration is present; production must set `ENFORCE_APP_CHECK=true` on Functions after App Check is configured.

## 7. PWA/offline safety

Catalog/app-shell GET requests can be cached. Order submission is intentionally never queued offline; checkout requires a live connection because an order is a real-world commitment and must not silently appear later.
