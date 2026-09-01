# Database Design Document

## AgriConnect — Firestore Data Design (Version 1)

---

## Document Metadata

| Field             | Value                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Document Name** | Database.md                                                                                           |
| **Version**       | 1.1                                                                                                   |
| **Status**        | Approved                                                                                              |
| **Last Updated**  | Phase 3 — Detailed Data Design (audit fields, image sub-schema, shared enums, emulator testing added) |
| **Depends On**    | PRD.md (v1.2, Approved), Architecture.md (v1.1, Approved)                                             |
| **Next Document** | UI/Wireframe Specification or Build & Sprint Plan (Phase 4 — to be determined)                        |

---

## 1. Purpose and Scope

This document expands Section 4 ("Firestore Architecture") of Architecture.md into a complete, implementation-ready data design. It defines every collection, document schema, field, validation rule, index, and access pattern required to build AgriConnect's data layer. No application or rules code is included — this is a specification that a future implementation phase will translate into actual Firestore Security Rules and TypeScript types.

This document assumes familiarity with the architectural principles already established in Architecture.md, in particular: path-based tenant isolation, the three-tier identity model (Anonymous → Phone-linked → Owner), and the decision to denormalize order line items.

**Canonical timestamp type:** Every field of type `timestamp` in this document — across all collections, without exception — refers to the native **Firestore `Timestamp` type** (as produced by `serverTimestamp()` / the Firebase Admin and Client SDKs), never a plain ISO-8601 string or Unix epoch number. This is treated as a project-wide convention, not a per-field decision, so that all date/time comparisons, ordering, and range queries behave consistently and take advantage of Firestore's native timestamp indexing and comparison semantics. TypeScript types and Zod schemas (see Section 12) representing these fields should map to Firestore's `Timestamp` class directly, converting to JavaScript `Date` only at the UI-rendering boundary.

---

## 2. Firestore Collections — Overview

All shop-owned data is nested under a single top-level `shops` collection, with one document per shop. A separate top-level `owners` collection maps authenticated owner accounts to the shop they manage.

```
shops/{shopId}
  ├─ categories/{categoryId}
  ├─ products/{productId}
  ├─ orders/{orderId}
  └─ customers/{normalizedPhone}

owners/{ownerUid}
```

| Collection Path             | Purpose                                                     | Approx. Document Count (V1 scale) |
| --------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `shops/{shopId}`            | Shop profile: identity, contact info, business hours, photo | 1                                 |
| `shops/{shopId}/categories` | Owner-configurable product categories                       | 5–15                              |
| `shops/{shopId}/products`   | Product catalog                                             | 50–300                            |
| `shops/{shopId}/orders`     | All orders placed by farmers                                | ~50/day, growing over time        |
| `shops/{shopId}/customers`  | One record per unique farmer phone number                   | 100–500                           |
| `owners/{ownerUid}`         | Maps an authenticated owner account to their shop           | 1                                 |

---

## 3. Document Schemas and Field Definitions

### 3.0 Standard Audit Fields and Soft-Delete Metadata (Policy)

To keep every collection's schema consistent and auditable, the following fields follow a single project-wide convention rather than being decided independently per collection. Not every field applies to every collection — applicability is noted in each schema table below — but where a field appears, it always follows this policy.

| Field       | Type                 | Populated When                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createdBy` | string (UID)         | Set once, at document creation, to the `request.auth.uid` of whichever identity tier created the document — the owner's UID for owner-managed data (shops, categories, products), or the farmer's anonymous/phone-linked UID for farmer-originated data (orders). Never changes after creation.                                                                                                                                                                                   |
| `updatedBy` | string (UID)         | Set on every subsequent write to the UID of whichever identity performed that specific update — e.g., the owner's UID when they edit a product or advance an order's status, or the farmer's UID when they cancel their own order. Overwritten on each update; reflects only the most recent writer, not a full history (see `statusHistory` on orders for a full audit trail of status changes specifically).                                                                    |
| `deletedAt` | timestamp \| null    | Set the moment a document is soft-deleted (i.e., the moment `active` is set to `false` for products/categories, or a shop is deactivated). Remains `null` for all documents that have never been deleted. Never cleared once set, even if the document is later reactivated — reactivation should be modeled as a new `active: true` write with its own `updatedAt`/`updatedBy`, while `deletedAt` retains the historical record of the original deactivation for audit purposes. |
| `deletedBy` | string (UID) \| null | Set alongside `deletedAt`, to the UID of whoever performed the soft-delete (in V1, always the shop owner, since only owners can deactivate products/categories/shops). Remains `null` for documents that have never been deleted.                                                                                                                                                                                                                                                 |

**Where these fields apply:** `createdBy`/`updatedBy` apply to every collection that has a meaningful single writer per operation (`shops`, `categories`, `products`, `orders`, `customers`). `deletedAt`/`deletedBy` apply only to collections that support soft-deletion via an `active` flag (`shops`, `categories`, `products`) — they are **not applicable** to `orders` (which use the `status: "cancelled"` lifecycle state instead of deletion — cancellation is a business event, not a data-removal event, and is already fully audited via `statusHistory`) or to `customers` (which are never deleted in V1; a customer record is a running summary of a phone number's order activity, not an entity with its own lifecycle to end).

### 3.1 `shops/{shopId}`

Represents the shop's public profile — the source for the "About the Shop" section (PRD FR-30–FR-32) as well as internal configuration.

| Field                  | Type                               | Required | Description                                                                                                                     |
| ---------------------- | ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `name`                 | string                             | Yes      | Shop's display name                                                                                                             |
| `ownerUid`             | string                             | Yes      | UID of the Firebase Auth account that owns this shop (redundant with `owners/{uid}.shopId`, kept for convenient reverse lookup) |
| `ownerDisplayName`     | string                             | Yes      | Owner's name, shown in "About the Shop"                                                                                         |
| `address`              | string                             | Yes      | Free-text shop address                                                                                                          |
| `phone`                | string                             | Yes      | Normalized phone number (e.g., `+91XXXXXXXXXX`), used for the "Call Shop" button                                                |
| `businessHours`        | string                             | Yes      | Free-text business hours (e.g., "Mon–Sat, 8 AM – 7 PM") — deliberately unstructured in V1 for simplicity                        |
| `shopPhotoURL`         | string                             | No       | Public URL of the shop photo in Firebase Storage                                                                                |
| `shopPhotoStoragePath` | string                             | No       | Storage path (kept alongside the URL to support future deletion/replacement)                                                    |
| `mapLocation`          | map `{ lat: number, lng: number }` | No       | Reserved for future Google Maps integration; nullable/absent in V1                                                              |
| `active`               | boolean                            | Yes      | Whether the shop is currently operating/visible; defaults to `true`                                                             |
| `createdAt`            | timestamp                          | Yes      | Set on shop creation, never updated                                                                                             |
| `updatedAt`            | timestamp                          | Yes      | Updated on every profile edit                                                                                                   |
| `createdBy`            | string (UID)                       | Yes      | Owner UID that created the shop record (see Section 3.0 policy)                                                                 |
| `updatedBy`            | string (UID)                       | Yes      | Owner UID of the most recent profile edit (see Section 3.0 policy)                                                              |
| `deletedAt`            | timestamp \| null                  | No       | Set if the shop is ever deactivated (e.g., business closure); `null` otherwise (see Section 3.0 policy)                         |
| `deletedBy`            | string (UID) \| null               | No       | Owner UID that deactivated the shop, if applicable; `null` otherwise                                                            |

### 3.2 `shops/{shopId}/categories/{categoryId}`

| Field       | Type                 | Required | Description                                                                                                         |
| ----------- | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `name`      | string               | Yes      | Category display name (e.g., "Fertilizers")                                                                         |
| `sortOrder` | number               | Yes      | Controls display order in farmer-facing category lists; owner-adjustable                                            |
| `active`    | boolean              | Yes      | Soft-deactivation flag; inactive categories are hidden from farmers but preserved for historical product references |
| `createdAt` | timestamp            | Yes      | Set on creation                                                                                                     |
| `updatedAt` | timestamp            | Yes      | Updated on rename/reorder/deactivate                                                                                |
| `createdBy` | string (UID)         | Yes      | Owner UID that created the category (see Section 3.0 policy)                                                        |
| `updatedBy` | string (UID)         | Yes      | Owner UID of the most recent edit (see Section 3.0 policy)                                                          |
| `deletedAt` | timestamp \| null    | No       | Set when `active` is set to `false`; `null` otherwise (see Section 3.0 policy)                                      |
| `deletedBy` | string (UID) \| null | No       | Owner UID that deactivated the category, if applicable; `null` otherwise                                            |

### 3.3 `shops/{shopId}/products/{productId}`

| Field                | Type                                                               | Required     | Description                                                                                                 |
| -------------------- | ------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `name`               | string                                                             | Yes          | Product display name                                                                                        |
| `brand`              | string                                                             | No           | Manufacturer/brand name; optional since some generic products may not have one                              |
| `categoryId`         | string                                                             | Yes          | Reference to a document ID in `categories` (soft reference, validated at write time by the service layer)   |
| `description`        | string                                                             | No           | Free-text product description                                                                               |
| `images`             | array of map (see Section 3.3.1 for the expanded image sub-schema) | Yes (min. 1) | Multiple images per product (PRD FR-9); exactly one entry must have `isCover: true`                         |
| `unit`               | string enum: `"kg"` \| `"litre"` \| `"piece"` \| `"packet"`        | Yes          | Unit of measure for the pack size                                                                           |
| `packSize`           | number                                                             | Yes          | Quantity per unit (e.g., `50` for a 50 kg bag, `1` for a single piece)                                      |
| `mrp`                | number                                                             | Yes          | Maximum retail price, in the shop's local currency (₹), must be > 0                                         |
| `discountPrice`      | number                                                             | No           | Discounted selling price; if present, must be ≤ `mrp`                                                       |
| `availabilityStatus` | string enum: `"available"` \| `"low_stock"` \| `"out_of_stock"`    | Yes          | Owner-set, farmer-facing availability signal (PRD FR-7)                                                     |
| `stockQty`           | number                                                             | No           | Soft internal stock count; not guaranteed accurate (see Section 9, Architecture.md Section 4.3)             |
| `active`             | boolean                                                            | Yes          | Soft-deletion flag; inactive products are hidden from farmers but preserved for historical order references |
| `createdAt`          | timestamp                                                          | Yes          | Set on creation                                                                                             |
| `updatedAt`          | timestamp                                                          | Yes          | Updated on any edit                                                                                         |
| `createdBy`          | string (UID)                                                       | Yes          | Owner UID that created the product (see Section 3.0 policy)                                                 |
| `updatedBy`          | string (UID)                                                       | Yes          | Owner UID of the most recent edit (see Section 3.0 policy)                                                  |
| `deletedAt`          | timestamp \| null                                                  | No           | Set when `active` is set to `false`; `null` otherwise (see Section 3.0 policy)                              |
| `deletedBy`          | string (UID) \| null                                               | No           | Owner UID that deactivated the product, if applicable; `null` otherwise                                     |

#### 3.3.1 Product Image Sub-Schema (`images[]` entries)

Each entry in a product's `images` array is itself a structured object, not a bare URL string:

| Field         | Type      | Required | Description                                                                                                                                                                                              |
| ------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string    | Yes      | A short unique identifier for this image within the product (e.g., a generated slug or short UUID), used to reference/reorder/delete a specific image without relying on array position, which can shift |
| `url`         | string    | Yes      | Public download URL of the image in Firebase Storage                                                                                                                                                     |
| `storagePath` | string    | Yes      | The underlying Storage path (e.g., `shops/{shopId}/products/{productId}/{imageId}.jpg`), kept alongside the URL so the exact file can be deleted or replaced without re-deriving the path                |
| `isCover`     | boolean   | Yes      | Whether this image is the product's default/cover image shown in listings; exactly one entry per product must have `isCover: true`, enforced at the validation layer                                     |
| `uploadedAt`  | timestamp | Yes      | When this specific image was uploaded — distinct from the parent product's `createdAt`/`updatedAt`, since images can be added individually after the product itself was created                          |

Using `id`-per-image (rather than relying on array index) is what makes it safe to delete or reorder a single image without disturbing the identity of the others — a common source of subtle bugs in array-of-object Firestore fields if not modeled explicitly.

### 3.4 `shops/{shopId}/orders/{orderId}`

| Field           | Type                                                                                                                                      | Required           | Description                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customerName`  | string                                                                                                                                    | Yes                | Name entered at checkout                                                                                                                                                                                                                                                                                                                                                           |
| `customerPhone` | string                                                                                                                                    | Yes                | Normalized phone number entered at checkout; join key to `customers/{normalizedPhone}`                                                                                                                                                                                                                                                                                             |
| `address`       | string                                                                                                                                    | Yes                | Free-text delivery address                                                                                                                                                                                                                                                                                                                                                         |
| `village`       | string                                                                                                                                    | No                 | Village/area name, if distinct from address                                                                                                                                                                                                                                                                                                                                        |
| `landmark`      | string                                                                                                                                    | No                 | Optional landmark to aid delivery                                                                                                                                                                                                                                                                                                                                                  |
| `items`         | array of map `{ productId: string, name: string, brand: string \| null, unit: string, packSize: number, qty: number, unitPrice: number }` | Yes (min. 1 entry) | Denormalized snapshot of each ordered product at time of order (see Architecture.md ADR-04)                                                                                                                                                                                                                                                                                        |
| `subtotal`      | number                                                                                                                                    | Yes                | Must equal the sum of `qty × unitPrice` across all `items`; validated both client-side and at the rules layer                                                                                                                                                                                                                                                                      |
| `status`        | string enum: `"placed"` \| `"confirmed"` \| `"out_for_delivery"` \| `"delivered"` \| `"cancelled"`                                        | Yes                | Current order lifecycle stage                                                                                                                                                                                                                                                                                                                                                      |
| `statusHistory` | array of map `{ status: string, at: timestamp, note: string \| null }`                                                                    | Yes                | Append-only audit trail of every status transition, including cancellation reasons                                                                                                                                                                                                                                                                                                 |
| `cancelReason`  | string                                                                                                                                    | No                 | Present only when `status == "cancelled"`                                                                                                                                                                                                                                                                                                                                          |
| `createdByUid`  | string                                                                                                                                    | Yes                | The Firebase Auth UID (anonymous or phone-linked) that created this order — used for rules validation, not personal identification. This is `orders`' equivalent of the standard `createdBy` field (Section 3.0); named `createdByUid` here rather than `createdBy` to make explicit that it may be an anonymous, non-personally-identifying UID, not necessarily a named account. |
| `createdAt`     | timestamp                                                                                                                                 | Yes                | Set on order creation, immutable                                                                                                                                                                                                                                                                                                                                                   |
| `updatedAt`     | timestamp                                                                                                                                 | Yes                | Updated on every status change                                                                                                                                                                                                                                                                                                                                                     |
| `updatedBy`     | string (UID)                                                                                                                              | Yes                | UID of whoever performed the most recent status change — the owner's UID for confirm/advance/deliver transitions, or the farmer's phone-linked UID for a self-cancellation (see Section 3.0 policy)                                                                                                                                                                                |

**Note on `deletedAt`/`deletedBy`:** these fields are intentionally **not present** on orders. Per the Section 3.0 policy, cancellation is modeled as a `status` transition (fully audited via `statusHistory`), not as a deletion — an order is never removed or hidden from the owner's records, even when cancelled.

### 3.5 `shops/{shopId}/customers/{normalizedPhone}`

Document ID is the normalized phone number itself (see Architecture.md ADR-05).

| Field         | Type         | Required | Description                                                                                                                   |
| ------------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `name`        | string       | Yes      | Most recently used name for this phone number                                                                                 |
| `address`     | string       | Yes      | Most recently used address                                                                                                    |
| `village`     | string       | No       | Most recently used village/area                                                                                               |
| `landmark`    | string       | No       | Most recently used landmark                                                                                                   |
| `lastOrderAt` | timestamp    | Yes      | Timestamp of the most recent order from this phone number                                                                     |
| `totalOrders` | number       | Yes      | Running count of orders placed, incremented on each new order                                                                 |
| `createdAt`   | timestamp    | Yes      | Set on first order from this phone number, never updated                                                                      |
| `createdBy`   | string (UID) | Yes      | UID of the farmer session (anonymous or phone-linked) whose first order created this customer record (see Section 3.0 policy) |
| `updatedBy`   | string (UID) | Yes      | UID of the farmer session whose most recent order last updated this record (see Section 3.0 policy)                           |

**Note on `deletedAt`/`deletedBy`:** not applicable — customer records are never deleted in V1 (see Section 3.0).

### 3.6 `owners/{ownerUid}`

Document ID is the Firebase Auth UID of the owner account.

| Field         | Type                   | Required | Description                                                                                      |
| ------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `shopId`      | string                 | Yes      | The shop this owner manages (single value in V1; see Section 10 for future multi-shop extension) |
| `email`       | string                 | Yes      | Owner's login email (mirrors Firebase Auth, kept for convenient display/lookup)                  |
| `displayName` | string                 | Yes      | Owner's name                                                                                     |
| `role`        | string enum: `"owner"` | Yes      | Reserved for future role differentiation (e.g., staff accounts); fixed to `"owner"` in V1        |
| `createdAt`   | timestamp              | Yes      | Set on account creation                                                                          |

**Note on `createdBy`/`updatedBy`/`deletedAt`/`deletedBy`:** not applicable to `owners/{ownerUid}` in V1 — this document is self-created by the owner during account setup (the document ID _is_ the creator's own UID, making a separate `createdBy` field redundant), and is not soft-deletable in V1 (account closure, if ever needed, would be handled outside the standard soft-delete pattern, likely via direct Firebase Auth account deletion coordinated with `shops/{shopId}.active` deactivation).

---

## 4. Relationships

| Relationship                                                 | Type                                               | Enforcement                                                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shops` → `categories` / `products` / `orders` / `customers` | One-to-many                                        | Structural — expressed via Firestore path nesting, not a foreign key field                                                                                                      |
| `products.categoryId` → `categories` document ID             | Soft reference (many-to-one)                       | Application-layer validation only (Firestore has no native referential integrity); service layer confirms the referenced category exists and is `active` before allowing a save |
| `orders.items[].productId` → `products` document ID          | Soft reference, informational only                 | Not required to resolve for the order to remain valid/displayable, since line items are denormalized (name/brand/price are self-contained)                                      |
| `orders.customerPhone` → `customers` document ID             | Soft reference (join key)                          | Application-layer lookup convenience; an order remains fully valid even if its corresponding customer document is missing or was never created                                  |
| `owners.shopId` → `shops` document ID                        | One-to-one in V1 (extensible to one-to-many later) | Application-layer; resolved at login to scope all subsequent owner queries/writes                                                                                               |

**On referential integrity generally:** Firestore provides no automatic cascade or constraint enforcement. All referential correctness in this system is therefore an **application-layer responsibility**, primarily enforced in the service layer (Architecture.md Section 2.4) at write time, and defensively handled at read time (e.g., a listing should gracefully skip or flag a product whose `categoryId` no longer resolves, rather than failing outright).

---

## 5. Data Validation Rules

Validation is enforced redundantly at two layers, per Architecture.md Section 7.4: client-side (service layer, for responsive UX) and Firestore Security Rules (authoritative, cannot be bypassed by a modified client). The rules below describe the validation contract; actual rule syntax is a build-phase artifact.

### 5.1 Product Validation

- `name` must be non-empty.
- `mrp` must be a positive number.
- `discountPrice`, if present, must be ≤ `mrp`.
- `unit` must be one of the four defined enum values.
- `packSize` must be a positive number.
- `images` must contain at least one entry, and exactly one entry must have `isCover: true`; each entry must include a non-empty `id`, `url`, `storagePath`, and `uploadedAt` (see Section 3.3.1).
- `categoryId` must reference an existing, active category within the same shop.
- `availabilityStatus` must be one of the three defined enum values (see Section 12 for the shared enum definition).
- `deletedAt`/`deletedBy` must both be `null` on creation, and must both be set together (never just one) whenever `active` transitions from `true` to `false`.

### 5.2 Category Validation

- `name` must be non-empty and unique (case-insensitive) among active categories within the same shop.
- `sortOrder` must be a non-negative integer.

### 5.3 Order Validation (Creation)

- `customerName`, `customerPhone`, `address` must be non-empty.
- `customerPhone` must match a normalized phone number format.
- `items` must contain at least one entry.
- Each item's `qty` must be a positive integer.
- `subtotal` must exactly equal the sum of `qty × unitPrice` across all `items` — this is the critical anti-tampering check, since a modified client could otherwise submit an artificially low subtotal.
- `status` must be exactly `"placed"` on creation; no other initial status is permitted.
- `createdByUid` must equal `request.auth.uid` of the submitting session.
- `statusHistory` must contain exactly one entry on creation, matching the initial `"placed"` status.

### 5.4 Order Validation (Status Transitions)

- Only the shop's authenticated owner may transition status beyond `placed`.
- A farmer (via phone-linked auth matching `customerPhone`) may only ever write a transition to `"cancelled"`, and only when the current status is still `"placed"`.
- Status transitions must follow the defined lifecycle sequence (`placed → confirmed → out_for_delivery → delivered`, with `cancelled` reachable from `placed` or `confirmed` only) — a rule should reject any write that attempts to skip stages or move backward.
- Every status change must append exactly one new entry to `statusHistory`; the array must never be truncated or have prior entries modified (append-only).
- `cancelReason` must be present when — and only when — `status == "cancelled"`.

### 5.5 Customer Validation

- Document ID must equal the normalized `customerPhone` used in the associated order, enforced by construction (the service layer derives the ID, never accepts it as arbitrary client input).
- `totalOrders` must only increase, never decrease, on update.

### 5.6 Shop Profile Validation

- `phone` must match a normalized phone number format.
- Only the shop's authenticated owner (matched via `owners/{uid}.shopId`) may write to any field on the shop document.

---

## 6. Composite Indexes

The following composite indexes are required to support the query patterns defined in this document. Firestore's automatic single-field indexes cover all other reads.

| Collection Path           | Composite Index                           | Supports                                                      |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| `shops/{shopId}/products` | `categoryId ASC, active ASC, name ASC`    | Farmer category browsing, alphabetized within active products |
| `shops/{shopId}/products` | `active ASC, availabilityStatus ASC`      | Owner's low-stock / out-of-stock dashboard widget             |
| `shops/{shopId}/orders`   | `status ASC, createdAt DESC`              | Owner's order queue, filtered by status, newest first         |
| `shops/{shopId}/orders`   | `customerPhone ASC, createdAt DESC`       | Farmer's order history, after phone verification              |
| `shops/{shopId}/orders`   | `createdAt DESC` (automatic single-field) | Owner dashboard "today's orders" and recent activity          |

**Deliberately avoided:** no composite index is defined for customer lookup, since the phone-as-document-ID design (Section 3.5) makes that lookup a direct `get()`, not a query — avoiding both an unnecessary index and its associated per-write indexing cost.

**Analytics queries (Section 9 of this document, and Architecture.md Section 4.3)** in V1 operate on `orders` filtered by a `createdAt` date range, which is covered by the existing single-field and `createdAt DESC` composite index above; no additional index is required for V1's client-computed analytics.

---

## 7. Security-Rule Strategy

This section restates and slightly extends Architecture.md Section 7.1 with data-design-specific detail. Actual rule syntax remains a build-phase artifact.

### 7.1 Guiding Principles (Recap)

- Deny by default; every collection requires an explicit grant.
- `shopId` is always derived from the request path, never trusted from a document field.
- Public reads are permitted for catalog/shop-profile data; writes are owner-gated.
- Order creation is open to any authenticated session (including anonymous) but strictly schema-validated.
- Order history reads and cancellation writes require phone-match against `request.auth.token.phone_number`.

### 7.2 Per-Collection Access Summary

| Collection          | Public Read                               | Anonymous Write                                                               | Phone-Linked Write                    | Owner Write                            |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------- |
| `shops/{shopId}`    | Yes                                       | No                                                                            | No                                    | Yes (own shop only)                    |
| `categories`        | Yes (active only)                         | No                                                                            | No                                    | Yes (own shop only)                    |
| `products`          | Yes (active only)                         | No                                                                            | No                                    | Yes (own shop only)                    |
| `orders`            | No (only via phone-match read, see below) | Create only, schema-validated                                                 | Cancel own order only (from `placed`) | Full read/write (own shop only)        |
| `customers`         | No                                        | Create/update own record (matching `customerPhone` of the order being placed) | Same as anonymous                     | Read-only (for context on order queue) |
| `owners/{ownerUid}` | No                                        | No                                                                            | No                                    | Read/write own document only           |

### 7.3 Order Read Access — Detailed Logic

- **Owner:** may read all orders within their own `shops/{shopId}/orders` subtree, unrestricted by status.
- **Farmer (phone-linked):** may read only orders where `resource.data.customerPhone == request.auth.token.phone_number`. This is the single rule that makes guest checkout safe from cross-farmer data exposure, and it is why Tier 2 (phone-linking) exists at all in the authentication model.
- **Anonymous farmer (not yet phone-linked):** cannot read any order document, including their own just-placed order, by document read — the on-screen "Order Placed" confirmation (PRD FR-18) is rendered from the data the client already holds locally at submission time, not from a subsequent authenticated read.

### 7.4 Emulator-Based Schema and Security Rule Testing

Before any schema or rules change is deployed to `agriconnect-staging` or `agriconnect-prod`, it must be validated locally and in CI using the **Firebase Local Emulator Suite** (Firestore, Auth, and Storage emulators), per Architecture.md Section 10.2. This is a required gate, not an optional practice:

- **Schema conformance tests** seed the emulator with representative documents for every collection in this document (including edge cases: a product with a missing `discountPrice`, an order at each lifecycle status, a soft-deleted category) and assert that the application's service layer reads and writes them exactly as specified in Section 3.
- **Security Rules tests** assert both directions for every access pattern in Section 7.2/7.3: that legitimate access succeeds (e.g., the shop's owner can update their own product; a phone-verified farmer can read their own order history) and that illegitimate access fails (e.g., a different shop's owner cannot write to this shop's products; an anonymous, non-phone-linked session cannot read any order's history; a farmer cannot forge a `subtotal` that doesn't match their `items`).
- **Every new field introduced by a migration (Section 11)** gets a corresponding emulator test confirming both the new field's validation and that documents lacking it (pre-migration) are still handled gracefully by the application layer.
- These tests run automatically on every pull request via the GitHub Actions pipeline (Architecture.md Section 10.2); a rules or schema change cannot be merged if it fails this suite.

---

## 8. Read/Write Access Patterns

This section documents the concrete query and write patterns the application performs against each collection, cross-referenced to the PRD functional requirement and Architecture.md data-flow section that motivates them.

| #   | Pattern                                      | Collection(s)                                            | Type                                                                                           | Frequency (approx.)              | Reference                     |
| --- | -------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------- |
| 1   | Browse products by category                  | `products`                                               | Real-time listener, composite query                                                            | High (every farmer session)      | PRD FR-11, Architecture 4.3   |
| 2   | Search products by name/brand                | `products`                                               | Client-side filter over cached listener results (V1 scale does not require server-side search) | Medium                           | PRD FR-12                     |
| 3   | View product detail                          | `products` (single doc)                                  | One-time read or listener                                                                      | High                             | PRD FR-13                     |
| 4   | Owner creates/edits/deletes product          | `products`                                               | Write                                                                                          | Low (owner-driven, occasional)   | PRD FR-6–FR-10                |
| 5   | Owner manages categories                     | `categories`                                             | Write                                                                                          | Very low                         | PRD FR-8                      |
| 6   | Farmer checkout — returning customer prefill | `customers/{phone}`                                      | Single document `get()`                                                                        | Every checkout                   | PRD FR-3, Architecture ADR-05 |
| 7   | Farmer places order                          | `orders` (create), `customers/{phone}` (upsert)          | Write (two documents, ideally in a single batched write for atomicity)                         | Every order                      | PRD FR-15–FR-18               |
| 8   | Owner receives new-order notification        | `orders` (Cloud Function trigger, no direct client read) | Trigger-based                                                                                  | Every order                      | Architecture 2.2, 4.3         |
| 9   | Owner views order queue                      | `orders`                                                 | Real-time listener, composite query by status                                                  | Continuous during business hours | PRD FR-21–FR-22               |
| 10  | Owner updates order status                   | `orders` (single doc)                                    | Write                                                                                          | Several times per order          | PRD FR-23–FR-24               |
| 11  | Farmer requests OTP for history/cancellation | (Firebase Auth, not Firestore)                           | N/A                                                                                            | Occasional                       | PRD FR-4                      |
| 12  | Farmer views order history                   | `orders`                                                 | Composite query by `customerPhone`                                                             | Occasional                       | PRD FR-20                     |
| 13  | Farmer cancels an order                      | `orders` (single doc)                                    | Write                                                                                          | Rare                             | PRD FR-19                     |
| 14  | Owner views dashboard summary                | `orders`                                                 | Range query by `createdAt`                                                                     | Daily                            | PRD FR-26–FR-27               |
| 15  | Owner views sales analytics                  | `orders`                                                 | Range query by `createdAt`, aggregated client-side                                             | Occasional                       | PRD FR-28–FR-29               |
| 16  | Farmer/owner views "About the Shop"          | `shops/{shopId}` (single doc)                            | One-time read or listener                                                                      | Occasional                       | PRD FR-30–FR-32               |

**Atomicity note (Pattern 7):** placing an order touches two documents (`orders` create and `customers` upsert). These should be performed as a single Firestore batched write, ensuring both succeed or both fail together — avoiding a scenario where an order is recorded but the customer prefill record silently fails to update, or vice versa.

---

## 9. Cost Optimization Considerations

Firestore billing is driven primarily by document reads, writes, and deletes (not raw data volume) at this scale, so the following design choices directly minimize cost:

- **Phone-as-document-ID for customers (Section 3.5)** avoids an entire query + composite index for the highest-frequency lookup, replacing it with the cheapest possible operation: a single-document read by known ID.
- **Real-time listeners over repeated polling.** Farmer-facing catalog listeners and owner-facing order-queue listeners are billed only for actual document reads on change, not on a polling interval — this is generally cheaper than a naive "refresh every N seconds" pattern would be.
- **Denormalized order line items (Section 4)** avoid needing a secondary read against `products` every time an order is displayed (e.g., in the owner's queue or the farmer's history) — the display data is already embedded in the order document itself.
- **Client-side search/filtering over `products` (Pattern 2, Section 8)** avoids a dedicated search service (e.g., Algolia) at V1's catalog size (50–300 products), which would introduce both cost and integration complexity disproportionate to the benefit at this scale.
- **Client-computed analytics (Section 4.3, Architecture Section 9)** avoid maintaining always-on aggregation infrastructure; at 10–50 orders/day, a date-ranged query over raw orders is cheap in both reads and complexity. This is explicitly the first thing to revisit if order volume grows an order of magnitude (see Section 10).
- **Soft-deletion (`active: false`) instead of hard deletion** for products and categories avoids the read/write cost of reconstructing historical order display data, and avoids the risk of breaking historical order integrity — at the modest cost of documents that are never physically removed (acceptable at this data volume).
- **Composite indexes are limited to the five patterns in Section 6** — every additional composite index adds a small ongoing write-time cost (each write must update every matching index); indexes are added only where a genuine query pattern requires them, not speculatively.

---

## 10. Future Scalability Considerations

- **Analytics rollups.** If order volume grows significantly (e.g., into the thousands per day, or years of accumulated history), replace client-computed analytics with Cloud Function-maintained rollup documents (e.g., `shops/{shopId}/analytics/{yyyy-mm}`), updated incrementally on each order write rather than scanned from raw data. This is additive and does not require changing the `orders` schema itself.
- **Multi-shop expansion.** Because every collection is already nested under `shops/{shopId}`, adding a second shop requires no schema change — only a new top-level `shops` document and its subtree. The `owners/{ownerUid}.shopId` field would need to become an array (or a separate `owner_shops` join collection) if a single owner manages multiple shops; this is a small, additive, backward-compatible change (existing single-`shopId` documents can be read as a one-element case during migration).
- **Search at larger catalog sizes.** If a shop's catalog grows well beyond a few hundred products, or multi-shop search across catalogs becomes necessary, introduce a dedicated search index (e.g., Algolia, Typesense, or Firestore's own extensions for full-text search) rather than continuing to rely on client-side filtering.
- **Rate limiting.** As noted in Architecture.md Section 7.5, true rate limiting (e.g., capping orders per phone number per hour) requires stateful server-side logic beyond what Security Rules alone can express. A future Cloud Function triggered on order creation, maintaining a short-lived counter (e.g., in Firestore or a lightweight cache), would be the natural home for this.
- **Multi-language product content.** If product names/descriptions require true multi-language content (not just UI chrome), fields such as `name` and `description` would evolve from plain strings to language-keyed maps (e.g., `{ en: "...", te: "..." }`). This is additive and backward-compatible: existing single-language values can be treated as the `en` case during a phased migration (see Section 11).
- **Payment integration.** Adding online payments would extend the `orders` schema with `paymentStatus` and `paymentMethod` fields, and introduce a payment-gateway Cloud Function. The COD-only assumption is currently isolated to a small number of schema fields and checkout-flow logic, not scattered through the data model, keeping this a contained future change.

---

## 11. Migration Strategy for Future Versions

Firestore has no native schema migration tooling (unlike a relational database with formal migrations), so this section defines the **process discipline** AgriConnect will follow as the schema evolves.

### 11.1 Guiding Principles

1. **Additive changes are preferred over breaking changes.** New optional fields can be introduced without touching existing documents; the application layer should always tolerate a missing field on older documents by falling back to a sensible default.
2. **Breaking changes require a phased rollout**, not a single cutover:
   - **Phase 1 — Dual-write/dual-read:** the application is updated to read the new field/shape if present, falling back to the old shape if not, while simultaneously writing both shapes on every update.
   - **Phase 2 — Backfill:** a one-time script (run via the Firebase Admin SDK, outside the client) updates existing documents to include the new field/shape.
   - **Phase 3 — Cutover:** once backfill is confirmed complete, the application is updated to read/write only the new shape, and the old field is removed in a subsequent release.
3. **Every schema change is documented** as an addendum to this Database.md document (or a versioned successor), so the schema's evolution has a clear audit trail alongside the codebase's own version history.
4. **Security Rules are updated in lockstep with schema changes**, and always tested against the Firebase Local Emulator Suite (per Architecture.md Section 10.2) before deployment — a schema change is not considered complete until its corresponding rules update passes the existing "legitimate access succeeds / cross-tenant access fails" test suite.

### 11.2 Anticipated Near-Term Migrations

- **Multi-shop owner mapping:** `owners/{uid}.shopId` (single value) → `owners/{uid}.shopIds` (array), following the phased approach above.
- **Multi-language content fields:** `name`/`description` (plain string) → language-keyed map, following the phased approach above, with the current value always mapped to the `en` key during Phase 1.
- **Payment fields:** addition of `paymentStatus`/`paymentMethod` to `orders` — a purely additive change requiring no phased rollout, since existing (COD) orders can simply default to `paymentStatus: "cod_pending"` or equivalent.
- **Analytics rollups:** introduction of a new `shops/{shopId}/analytics/{period}` collection — purely additive, no changes to existing collections required, and no migration of historical data is strictly necessary (rollups can be computed forward from the point of introduction, with historical analytics continuing to use the client-computed method for older date ranges if needed).

---

## 12. Shared Domain Enums

The following enums are **canonical and single-sourced in design** — meaning the same set of allowed values must be kept in sync across four independent representations in the eventual implementation: the Firestore document data itself, TypeScript type definitions, Zod runtime validation schemas (used in the service layer for the client-side validation pass described in Section 5), and Firestore Security Rules (the authoritative server-side check). Documenting them once here, ahead of implementation, is intended to prevent the four representations from drifting out of sync as the product evolves.

| Enum                            | Values                                                                         | Used By                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Product Unit**                | `"kg"`, `"litre"`, `"piece"`, `"packet"`                                       | `products.unit` (Section 3.3)                                                |
| **Product Availability Status** | `"available"`, `"low_stock"`, `"out_of_stock"`                                 | `products.availabilityStatus` (Section 3.3)                                  |
| **Order Status**                | `"placed"`, `"confirmed"`, `"out_for_delivery"`, `"delivered"`, `"cancelled"`  | `orders.status`, each entry in `orders.statusHistory[].status` (Section 3.4) |
| **Owner Role**                  | `"owner"` (single value in V1; reserved for future expansion, e.g., `"staff"`) | `owners.role` (Section 3.6)                                                  |

**Implementation guidance (for the future build phase, not part of this design document):** each enum should be defined exactly once in a shared constants/types module and imported by (a) the TypeScript interfaces in `types/`, (b) the Zod schemas used for service-layer validation, and (c) translated manually — since Firestore Rules cannot import external code — into the equivalent literal-value checks in `firestore.rules`, with a code comment in the rules file pointing back to the shared source so the two stay traceably linked even though they can't be technically shared at build time.

---

**Document Status:** Approved. No application or rules code has been generated as part of this document, per instruction. This document, together with Architecture.md, provides the complete data-design foundation needed before any Firestore Security Rules implementation or application code is written.
