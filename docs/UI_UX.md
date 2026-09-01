# UI/UX Design Document

## AgriConnect — User Interface & Experience Specification (Version 1)

---

## Document Metadata

| Field             | Value                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document Name** | UI_UX.md                                                                                                                                            |
| **Version**       | 1.1                                                                                                                                                 |
| **Status**        | Approved                                                                                                                                            |
| **Last Updated**  | Phase 4 — UI/UX Design (design tokens, component states, accessibility checklist, expanded empty states, micro-interactions, notification UX added) |
| **Depends On**    | PRD.md (v1.2, Approved), Architecture.md (v1.1, Approved), Database.md (v1.1, Approved)                                                             |
| **Next Document** | Build & Sprint Plan (Phase 5 — to be determined)                                                                                                    |

---

## 1. Design Principles

These principles govern every screen and component decision in this document. They translate the PRD's usability requirements (large buttons, minimal text, simple navigation) into concrete design discipline.

1. **Clarity over cleverness.** Every screen should be understandable at a glance by someone who has never used a shopping app before. No design pattern is used purely because it looks modern — it must first pass the test of being immediately understandable to Venkaiah (the farmer persona).
2. **One primary action per screen.** Every screen has exactly one obvious next step (visually dominant, large, high-contrast), with secondary actions visually subordinate. Farmers should never have to choose between several equally-weighted buttons.
3. **Image before text.** Products, categories, and the shop itself are represented visually first, with text as supporting detail — appropriate for users who may have limited reading fluency in the app's current language (English).
4. **Trust is designed, not assumed.** Every point of friction removed for speed (guest checkout, no login) is paired with a visible trust signal (shop photo, "Call Shop" button, clear order confirmation, visible order status) so farmers never feel like they've sent money or information into a void.
5. **Forgiving over restrictive.** Farmers can always see and edit their cart before committing, can cancel a just-placed order, and are never asked to re-enter information they've already provided (returning-customer prefill). Mistakes should be easy to correct, not just prevented.
6. **Consistency across the two experiences.** The Owner console and Farmer app share the same visual language (color, type, iconography) even though their layouts differ — this reinforces that it is one trustworthy product, not two disconnected tools.
7. **Design for the thumb, not the cursor.** Even though the owner may occasionally use a desktop browser, the primary design target for both experiences is a single thumb operating a mid-range Android phone.

---

## 2. User Personas and Accessibility Considerations

### 2.1 Personas (Recap from PRD, with UI-Specific Implications)

**Venkaiah — The Farmer**

- Basic Android smartphone, small-to-medium screen, possibly an older/lower-resolution display
- Comfortable with visual, icon-driven apps (WhatsApp) but limited patience for text-heavy or form-heavy flows
- May have limited English reading fluency — text should always be paired with an icon or image, never text-only where avoidable
- **UI implications:** large tap targets, minimal typing (numeric keypad for phone entry, dropdown/stepper for quantity rather than free-text), generous spacing to prevent mis-taps, no reliance on hover states (touch-only device)

**Ramulu — The Shop Owner**

- Moderately tech-comfortable, likely to use the app on both his phone (quick checks) and possibly a larger device (daily catalog/order management)
- Needs information density and efficiency for repeated daily tasks (reviewing orders, updating stock) without the extreme simplification the farmer experience requires
- **UI implications:** slightly denser information layout is acceptable in the owner console (e.g., tables for the order queue), but the same large-tap-target and high-contrast principles still apply, since he is not necessarily more digitally literate than a typical small business owner

### 2.2 Accessibility Considerations

While AgriConnect V1 does not target formal WCAG AA/AAA certification (not a regulatory requirement per the PRD), the design deliberately adopts several accessibility best practices because they directly serve the core user base:

- **Minimum tap target size of 44×44px**, with generous spacing between adjacent tappable elements to reduce accidental taps — this is as much a low-literacy/low-dexterity usability requirement as an accessibility one.
- **Minimum color contrast ratio of 4.5:1** for all body text against its background, ensuring readability in bright outdoor sunlight (a realistic usage condition for farmers, who may check the app in a field).
- **No information conveyed by color alone.** The availability status badge (Available/Low Stock/Out of Stock), for example, uses color plus an icon plus a text label together — never color alone — so the design isn't dependent on a user's ability to distinguish specific hues.
- **Legible type sizes.** Body text is never smaller than 16px; primary actions and prices are set larger still, both for readability and because these are the details a farmer most needs to get right.
- **Icon + label pairing throughout.** No icon is used in isolation without an accompanying text label, in anticipation of a future point where some labels are in Telugu and users may benefit from bilingual or icon-assisted recognition during any transition period.
- **Reduced reliance on precise gestures.** Swipe (e.g., the image gallery) always has an equivalent tap-based alternative (visible dots/arrows), since not every farmer will discover or reliably perform a swipe gesture.

### 2.3 Accessibility Checklist

This checklist consolidates the concrete, verifiable accessibility requirements that apply across every screen and component in this document. It should be used as a build-phase acceptance checklist, not just a design aspiration.

| Category                  | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Minimum touch targets** | Every interactive element (buttons, tabs, list-row taps, icon buttons, stepper controls) is at least 44×44px, with a minimum of 8px of surrounding space before the next tappable element, per Section 2.2.                                                                                                                                                                                                                            |
| **Keyboard navigation**   | While the primary target is touch, the Owner console (more likely to see desktop/keyboard use) supports full keyboard operability: logical tab order following visual layout, all actions reachable without a mouse, and no keyboard trap within modals/dialogs (e.g., the cancellation-confirmation dialog).                                                                                                                          |
| **Screen reader support** | All images (product photos, shop photo, category tiles) carry meaningful `alt` text (e.g., "Fertilizer 50kg bag — Brand X," not "product image"). Icon-only buttons (e.g., a trash/remove icon on a cart row) always carry an accessible label (e.g., "Remove item from cart") even where no visible text label is shown alongside the icon.                                                                                           |
| **ARIA guidelines**       | Status components (`StatusBadge`, `StatusPill`, `StatusStepper`) expose their current state via appropriate ARIA roles/attributes (e.g., `role="status"` or `aria-live="polite"` regions where state changes should be announced) rather than relying on color/icon alone for assistive technology users. Form fields use proper `<label>` association (or `aria-label`) for every input, never a placeholder alone as the only label. |
| **Focus management**      | When a modal/dialog opens (e.g., cancellation confirmation, OTP entry), focus moves to the first interactive element within it, and returns to the triggering element on close. Route transitions (e.g., Category → Product Detail) move focus to the new page's main heading, so screen reader users receive an orientation cue on navigation.                                                                                        |
| **Color contrast**        | Minimum 4.5:1 contrast ratio for body text, and minimum 3:1 for large text (18px+ bold or 24px+ regular) and meaningful icons/graphical elements, per Section 2.2 and the token values in Section 8.5.                                                                                                                                                                                                                                 |
| **Error announcements**   | Form validation errors (Section 11) are announced to assistive technology via an `aria-live="assertive"` (or equivalent) region at the moment they appear, not only rendered visually — critical since a screen-reader user would otherwise have no indication a submission attempt failed.                                                                                                                                            |

---

## 3. Information Architecture

AgriConnect's information architecture is split into two independent trees — Farmer and Owner — sharing only the underlying data, not the navigation structure.

```
AgriConnect
│
├── FARMER EXPERIENCE (guest, no login)
│   ├── Home
│   │   ├── Category Grid
│   │   └── Featured/Recently Viewed (optional, light-touch)
│   ├── Category → Product Listing
│   ├── Product Detail
│   ├── Cart
│   ├── Checkout
│   ├── Order Confirmation
│   ├── My Orders (OTP-gated)
│   │   ├── Order History List
│   │   └── Order Detail / Status
│   └── About the Shop
│       └── Call Shop (action, not a separate screen)
│
└── OWNER EXPERIENCE (authenticated)
    ├── Login
    ├── Dashboard
    │   ├── Today's Summary
    │   ├── Low-Stock Alerts
    │   └── Sales Analytics
    ├── Products
    │   ├── Product List
    │   └── Add/Edit Product
    ├── Categories
    │   └── Add/Edit/Reorder Category
    ├── Orders
    │   ├── Order Queue (by status)
    │   └── Order Detail (confirm/adjust/advance/cancel)
    └── Shop Settings
        └── About-the-Shop Content Editor
```

**Design rationale:** the Farmer tree is intentionally shallow — no path from Home to Checkout is more than 3 taps deep, aligning with the PRD's "under 2 minutes to order" goal. The Owner tree is slightly deeper, reflecting a management tool used repeatedly throughout the day by a single trusted user, where a small amount of additional structure aids organization rather than hindering speed.

---

## 4. Navigation Structure

### 4.1 Farmer Navigation — Bottom Tab Bar

A persistent bottom tab bar (thumb-reachable) with five destinations:

| Tab        | Icon Concept                                  | Destination                                          |
| ---------- | --------------------------------------------- | ---------------------------------------------------- |
| Home       | House/storefront icon                         | Category grid, entry point                           |
| Categories | Grid icon                                     | Full category list (useful once >5 categories exist) |
| Cart       | Shopping bag/cart icon, with item-count badge | Current cart contents                                |
| My Orders  | Receipt/list icon                             | OTP-gated order history                              |
| About Shop | Storefront/info icon                          | Shop profile + Call Shop                             |

The cart tab always shows a live item-count badge so a farmer never loses track of what they've added while browsing. No tab requires authentication to view — the OTP prompt appears only when "My Orders" content is actually requested, not when the tab itself is tapped (the tab can show the OTP-entry screen directly rather than blocking the whole tab).

### 4.2 Owner Navigation — Sidebar (Desktop) / Bottom Tabs (Mobile)

On a wider viewport, a persistent left sidebar; on a narrow (phone) viewport, the same five destinations collapse into a bottom tab bar, mirroring the Farmer app's pattern for consistency:

| Destination   | Icon Concept                                            |
| ------------- | ------------------------------------------------------- |
| Dashboard     | Chart/gauge icon                                        |
| Products      | Package/box icon                                        |
| Categories    | Tag/folder icon                                         |
| Orders        | Clipboard/list icon (with a live "pending" count badge) |
| Shop Settings | Gear/storefront icon                                    |

### 4.3 Cross-Cutting Navigation Elements

- **Back navigation:** every non-Home screen has a clear, large back affordance (top-left, standard placement) in addition to the device's native back gesture/button.
- **Breadcrumb-free design:** given the shallow tree depth, no breadcrumb trail is needed anywhere in the Farmer experience; the Owner console likewise avoids breadcrumbs in favor of a persistent page title.

---

## 5. Complete Screen Inventory

### 5.1 Farmer Screens

| #   | Screen                                       | Purpose                                                               | Auth Requirement                |
| --- | -------------------------------------------- | --------------------------------------------------------------------- | ------------------------------- |
| F1  | Home                                         | Category grid entry point, shop branding                              | None                            |
| F2  | Category Listing                             | Browse products within a category                                     | None                            |
| F3  | Product Detail                               | View full product info, add to cart                                   | None                            |
| F4  | Search Results                               | Product search by name/brand                                          | None                            |
| F5  | Cart                                         | Review/edit cart before checkout                                      | None                            |
| F6  | Checkout                                     | Enter/confirm name, phone, address; place order                       | None (anonymous auth is silent) |
| F7  | Order Confirmation                           | "Order Placed" success screen                                         | None                            |
| F8  | My Orders — Phone Entry                      | Enter phone to request OTP                                            | None                            |
| F9  | My Orders — OTP Verification                 | Enter OTP code                                                        | Phone-linking in progress       |
| F10 | My Orders — History List                     | List of past orders and statuses                                      | Phone-linked                    |
| F11 | Order Detail / Status                        | Full detail + status stepper for one order; cancel action if eligible | Phone-linked                    |
| F12 | About the Shop                               | Shop profile, photo, hours, Call Shop button                          | None                            |
| F13 | Offline Notice (state, not a distinct route) | Shown inline when connectivity is lost                                | None                            |

### 5.2 Owner Screens

| #   | Screen            | Purpose                                                                       | Auth Requirement |
| --- | ----------------- | ----------------------------------------------------------------------------- | ---------------- |
| O1  | Login             | Email/password sign-in                                                        | None (pre-auth)  |
| O2  | Dashboard         | Today's summary, low-stock alerts, analytics entry point                      | Owner            |
| O3  | Sales Analytics   | Detailed analytics with date-range filter                                     | Owner            |
| O4  | Product List      | Browse/search/filter the full catalog                                         | Owner            |
| O5  | Add/Edit Product  | Product form: name, brand, category, images, pricing, availability            | Owner            |
| O6  | Category List     | View/reorder/deactivate categories                                            | Owner            |
| O7  | Add/Edit Category | Category form: name, sort order                                               | Owner            |
| O8  | Order Queue       | List of orders, filterable by status                                          | Owner            |
| O9  | Order Detail      | Full order detail, status-advance controls, quantity adjustment, cancellation | Owner            |
| O10 | Shop Settings     | Edit About-the-Shop content, photo, hours                                     | Owner            |

---

## 6. Wireframe Descriptions

Each description covers layout, primary/secondary actions, and key states. These are structural descriptions, not visual mockups or code.

### F1 — Home

- **Top:** shop name/logo bar (compact), optionally the shop photo as a banner.
- **Middle:** a scrollable grid of large category tiles (2 columns on phone width), each tile showing a representative image and the category name in large text beneath it.
- **Bottom:** persistent tab bar (Section 4.1).
- **Primary action:** tap any category tile → Category Listing (F2).
- **Empty state:** if the owner hasn't yet created any categories, show a friendly placeholder illustration with the text "The shop is getting ready — please check back soon," since Home has nothing meaningful to show without at least one category.

### F2 — Category Listing

- **Top:** category name as the page title, with a back affordance and a search icon (→ F4).
- **Middle:** a vertically scrolling list of product cards, one column, each card showing: cover image (large, left or top), product name, brand (smaller, secondary text), price (with MRP struck through if a discount applies), and the availability badge (color + icon + label).
- **Primary action per card:** tap anywhere on the card → Product Detail (F3). A large "+" quick-add button on the card itself allows adding one unit directly to cart without opening the detail screen, for repeat/known purchases.
- **Empty state:** "No products in this category yet" if the owner has created the category but not yet added products.
- **Loading state:** skeleton placeholder cards (grey blocks in the same shape as real cards) while the initial listener resolves.

### F3 — Product Detail

- **Top:** swipeable image gallery (full-width), with visible dot indicators and left/right tap zones as a non-swipe alternative; the cover image (`isCover: true`) is shown first.
- **Middle:** product name (large), brand, pack size/unit, price block (MRP struck through + discount price if applicable, or plain price if no discount), the availability badge, and a short description if provided.
- **Bottom (sticky):** a quantity stepper (−/number/+) and a large "Add to Cart" primary button, always visible without scrolling.
- **Secondary element:** a small "Call Shop" affordance if the farmer wants to ask about this specific product before adding it — reinforces the "About the Shop" trust pattern contextually.
- **Out-of-stock state:** the "Add to Cart" button is replaced with a disabled state labeled "Currently Unavailable," and the availability badge is prominently red — the farmer is never allowed to add an out-of-stock item, avoiding a false expectation.

### F4 — Search Results

- **Top:** a search input (auto-focused on entry), large enough to accommodate on-screen keyboard use comfortably.
- **Middle:** results rendered as the same product-card list style as F2, for visual consistency.
- **Empty state:** "No products found for '[query]' — try a different search or browse by category," with a button back to Home.

### F5 — Cart

- **Top:** page title "Your Cart," with item count.
- **Middle:** one row per cart line item: product image thumbnail, name, unit price, quantity stepper, line subtotal, and a remove (trash icon) action.
- **Bottom (sticky):** subtotal total (large, bold) and a primary "Proceed to Checkout" button.
- **Empty state:** friendly illustration + "Your cart is empty" + a button back to Home/Categories — this is the single most important empty state in the app, since an empty cart is a common first-visit condition, not an error.

### F6 — Checkout

- **Top:** page title "Delivery Details."
- **Form fields, top to bottom:** Name (text), Phone Number (numeric keypad, triggers the returning-customer prefill lookup on blur/completion), Address (multi-line text), Village/Area (text, optional), Landmark (text, optional).
- **Prefill behavior:** if the phone number matches an existing customer record, Name/Address/Village/Landmark auto-populate with a small inline note ("Welcome back! We've filled in your details — edit if needed") so the farmer understands why fields are already filled and feels in control of correcting them.
- **Bottom (sticky):** order summary (item count + subtotal) and a large "Place Order (Cash on Delivery)" primary button, explicitly labeling the payment method so there is never ambiguity about payment expectations.
- **Validation state:** required-field errors appear inline, beneath each field, the moment the farmer attempts to proceed with a missing/invalid field — not preemptively while they're still typing.

### F7 — Order Confirmation

- **Center-stage:** a large success icon/illustration, "Order Placed!" heading, and a short reassurance line: "The shop owner will call you shortly to confirm."
- **Below:** a summary of what was ordered (items + subtotal) and the delivery address entered, so the farmer has a final visual confirmation of what they just committed to.
- **Actions:** "Continue Shopping" (secondary, back to Home) and "View My Orders" (primary, → F8/F10 flow).

### F8 — My Orders: Phone Entry

- **Center-stage:** a short explanatory line ("Enter your phone number to see your orders"), a phone number input (numeric keypad), and a large "Send Code" button.
- **Rationale:** this screen is intentionally sparse and reassuring — it is the one moment in the Farmer experience that resembles a "login," and should feel as lightweight and low-friction as possible.

### F9 — My Orders: OTP Verification

- **Center-stage:** a 4-digit code input (large, individually boxed digits, numeric keypad), a "Verify" button, and a "Resend Code" secondary link (rate-limited, becomes active after a short countdown).
- **Error state:** "That code didn't match — please try again," with the input cleared for re-entry, never a technical error message.

### F10 — My Orders: History List

- **Top:** page title "My Orders."
- **Middle:** one row per order: order date, item count/summary, subtotal, and a status pill (using the same color/icon/label pattern as the availability badge, for visual consistency across the app).
- **Empty state:** "You haven't placed any orders yet" + a button back to Home.
- **Primary action per row:** tap → Order Detail (F11).

### F11 — Order Detail / Status

- **Top:** order date and order ID (short, farmer-friendly reference, not a raw database ID).
- **Middle:** a horizontal or vertical **status stepper** component showing all five possible stages with the current one highlighted, making the order's position in its lifecycle immediately legible without reading text.
- **Below:** full item list, subtotal, and the delivery address originally submitted.
- **Conditional action:** if `status == "placed"`, a "Cancel Order" button is shown (secondary/destructive styling), which opens a short confirmation step before submitting the cancellation. If status has advanced beyond `placed`, this button is absent entirely (not just disabled) to avoid suggesting a false possibility.

### F12 — About the Shop

- **Top:** the shop photo as a banner image.
- **Middle:** shop name (large), owner name, address, business hours — each paired with a small icon (pin, clock, person) for quick scanning.
- **Bottom (prominent, sticky or high on the page):** a large "Call Shop" button, tapping which opens the device's native phone dialer pre-filled with the shop's number — this is deliberately one of the most visually prominent buttons in the entire Farmer experience, per its role as a trust-building safety net.
- **Future-ready element:** a placeholder "View on Map" affordance, visually present but shown in a disabled/subtle state in V1 until Google Maps integration is built (Architecture.md Section 9.3/12), rather than being entirely absent — this signals to farmers that the feature is coming, without implying it currently works.

### F13 — Offline Notice (Inline State)

- A slim, non-blocking banner at the top of the current screen: "You're offline — showing saved information," which disappears automatically once connectivity is restored. Checkout (F6) additionally disables its primary action and shows "No internet connection — please try again" in place of the button label when offline is detected.

---

### O1 — Owner Login

- **Center-stage:** shop/product logo, email field, password field, "Log In" primary button, "Forgot Password" secondary link.
- **Error state:** inline error beneath the password field for invalid credentials; a distinct message for account-lockout scenarios if Firebase Auth's protections trigger.

### O2 — Dashboard

- **Top:** a row of summary stat cards: Today's Orders, Pending Confirmations, This Week's Revenue — each large-numeral, glanceable.
- **Middle:** a "Low Stock / Out of Stock" alert panel, listing affected products with a quick link into their edit screen (O5).
- **Bottom:** a condensed analytics preview (top 3 best-sellers, a simple trend sparkline) with a "View Full Analytics" link to O3.
- **Primary action:** the stat card for "Pending Confirmations" is the most visually emphasized, since it represents the owner's most time-sensitive task.

### O3 — Sales Analytics

- **Top:** a date-range filter control (Today / This Week / This Month / Custom).
- **Middle:** a best-sellers table/list (product name, units sold, revenue), a category breakdown (simple bar or donut chart), an order-volume trend chart (line/bar over the selected range), and a new-vs-repeat customer split (simple two-segment visual).
- **Empty state:** "Not enough order data yet for this period" if a very new shop or narrow date range yields no results.

### O4 — Product List

- **Top:** a search/filter bar (by name, category, availability status) and a prominent "+ Add Product" button.
- **Middle:** a table (desktop) or stacked card list (mobile) of all products: thumbnail, name, brand, category, price, availability badge, active/inactive toggle.
- **Row actions:** Edit (→ O5), and a toggle for Active/Inactive (soft-delete, per Database.md Section 3.0) rather than a destructive "Delete" button as the primary action — deletion of a product with historical order references is intentionally not offered directly in the UI, to prevent accidental loss of the display data those historical orders depend on.

### O5 — Add/Edit Product

- **Form sections, in order:** Basic Info (name, brand, category dropdown, description), Images (multi-image uploader with drag-to-reorder and a clear "set as cover" action per image), Pricing (MRP, discount price with inline validation preventing discount > MRP), Unit & Pack Size (unit dropdown + pack size number field), Availability Status (a clear three-option selector: Available / Low Stock / Out of Stock, not a free-text field).
- **Bottom (sticky):** "Save Product" primary button; "Cancel" secondary, returning to O4 without saving.
- **Validation state:** each section validates inline as described in Database.md Section 5.1, with clear, plain-language error messages (e.g., "Discount price can't be higher than MRP" rather than a technical validation code).

### O6 — Category List

- **Middle:** a reorderable list (drag handles) of categories, each row showing name, product count within it, and an active/inactive toggle.
- **Primary action:** "+ Add Category" button, prominent at the top of the list.

### O7 — Add/Edit Category

- **Form fields:** Name (text, with inline uniqueness validation per Database.md Section 5.2), Sort Order (implicitly set by drag position on O6, rarely edited directly here).
- **Bottom:** "Save" / "Cancel."

### O8 — Order Queue

- **Top:** status filter tabs (All / Placed / Confirmed / Out for Delivery / Delivered / Cancelled), with the "Placed" tab visually emphasized (e.g., a badge count) since it represents orders awaiting the owner's action.
- **Middle:** one row per order: farmer name, phone (tap-to-call), item summary, subtotal, time placed, status pill.
- **Primary action per row:** tap → Order Detail (O9).

### O9 — Order Detail (Owner View)

- **Top:** farmer name, phone (tap-to-call affordance directly here, not just in the queue), full delivery address.
- **Middle:** full item list with quantity — **editable at the `placed`/pre-confirmation stage only** (per PRD FR-24), allowing the owner to adjust for partial stock before confirming.
- **Bottom:** the current status stepper (same component as F11, reused for visual/component consistency across Farmer and Owner experiences) with large, unambiguous action buttons for the next valid transition (e.g., "Confirm Order," "Mark Out for Delivery," "Mark Delivered") and a "Cancel Order" secondary/destructive action requiring a reason to be entered before submitting.

### O10 — Shop Settings

- **Form sections:** Shop Photo (uploader), Shop Name, Owner Display Name, Address, Phone Number, Business Hours (simple structured or free-text entry), and a disabled/future-labeled "Map Location" field consistent with F12's future-ready treatment.
- **Bottom:** "Save Changes" primary button.

---

## 7. Component Library

Shared, reusable components used across both Farmer and Owner experiences (implemented atop Shadcn UI primitives per Architecture.md Section 2.1):

| Component                           | Used In                       | Notes                                                                                                           |
| ----------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ProductCard`                       | F2, F4, O4 (list variant)     | Image-first, price + availability badge always visible                                                          |
| `AvailabilityBadge`                 | F2, F3, O4, O5                | Color + icon + text label, never color alone (Section 2.2)                                                      |
| `ImageCarousel`                     | F3, O5 (upload preview)       | Swipeable with visible dot indicators and tap-zone fallback                                                     |
| `PriceTag`                          | F2, F3, F5, F6, F7, O3, O4    | Handles MRP strike-through + discount display consistently                                                      |
| `CallShopButton`                    | F12, F3 (secondary), O8, O9   | Triggers native `tel:` dialer                                                                                   |
| `StatusStepper`                     | F11, O9                       | Shared visual language for order lifecycle across both experiences                                              |
| `StatusPill`                        | F10, O8                       | Compact status indicator for list contexts (distinct from the full Stepper)                                     |
| `QuantityStepper`                   | F3, F5, O9 (owner adjustment) | Large −/+ tap targets, no free-text quantity entry for farmers                                                  |
| `EmptyState`                        | F1, F2, F5, F10, F4, O3       | Consistent illustration + message + optional action button pattern                                              |
| `SkeletonCard` / `SkeletonRow`      | F2, O4, O8                    | Loading placeholders matching the shape of the real content                                                     |
| `InlineFormError`                   | F6, O5, O7, O10               | Consistent error message placement/styling across all forms                                                     |
| `PrimaryButton` / `SecondaryButton` | Everywhere                    | Two clearly distinct visual weights, used consistently so farmers always recognize "the one big obvious button" |
| `OTPInput`                          | F9                            | Individually boxed digit entry                                                                                  |
| `Toast/InlineBanner`                | F13, general confirmations    | Non-blocking status messages (e.g., offline notice, "Saved" confirmation)                                       |

---

## 8. Design System

### 8.1 Typography

| Role              | Size (approx.) | Weight               | Usage                                                                                                                                            |
| ----------------- | -------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Display / Hero    | 28–32px        | Bold                 | Shop name on Home/About, "Order Placed!" confirmation heading                                                                                    |
| Page Title        | 22–24px        | Semibold             | Screen headings (e.g., "Your Cart," "My Orders")                                                                                                 |
| Section Heading   | 18–20px        | Semibold             | Form section headers, dashboard card titles                                                                                                      |
| Body              | 16px           | Regular              | Descriptions, form labels, general content — never smaller than this, per Section 2.2                                                            |
| Secondary/Caption | 14px           | Regular, muted color | Brand names, timestamps, helper text                                                                                                             |
| Price (Emphasis)  | 20–22px        | Bold                 | Product prices — deliberately larger than standard body text, since price is one of the most decision-critical pieces of information on the page |

A single, widely-available, highly legible sans-serif typeface family is used throughout (system font stack via Tailwind's default, avoiding a custom webfont dependency that would add load time on constrained connections).

### 8.2 Color Palette

| Role               | Color Direction                                | Usage                                                                                                          |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Primary Brand      | Deep green                                     | Primary buttons, active tab indicators, brand accents — evokes agriculture without being a cliché bright green |
| Secondary/Accent   | Warm amber/gold                                | Discount badges, highlighted stat cards — used sparingly for emphasis                                          |
| Success            | Green (distinct shade from primary)            | "Available" badge, order confirmation, "Delivered" status                                                      |
| Warning            | Amber                                          | "Low Stock" badge, "Confirmed"/"Out for Delivery" statuses                                                     |
| Danger/Critical    | Red                                            | "Out of Stock" badge, "Cancelled" status, destructive action buttons                                           |
| Neutral/Background | Off-white / light grey                         | Page backgrounds, card backgrounds                                                                             |
| Text — Primary     | Near-black (not pure black, for reduced glare) | Body copy                                                                                                      |
| Text — Secondary   | Mid-grey                                       | Captions, secondary metadata                                                                                   |

Every status/availability color is paired with a distinct icon shape (Section 2.2), so the palette supports but never solely carries meaning.

### 8.3 Spacing System

A consistent 4px-based spacing scale (4, 8, 12, 16, 24, 32, 48px) is used throughout, implemented via Tailwind's default spacing scale for consistency and to avoid ad hoc pixel values creeping into the design over time. Generous spacing (minimum 16px) is maintained between adjacent tappable elements specifically to reduce mis-taps on smaller Android screens.

### 8.4 Iconography

A single, consistent icon set (Lucide-style outline icons, matching the `lucide-react` library already available in the technical stack per Architecture.md) is used throughout, at a consistent stroke width. Icons are never used as the sole carrier of meaning (Section 2.2) and are always paired with a text label in any actionable context (buttons, tabs, nav items).

---

## 9. Responsive Behavior

| Breakpoint                        | Farmer Experience                                                                                                                         | Owner Experience                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Mobile (< 640px) — primary target | Single-column layouts throughout; bottom tab navigation                                                                                   | Bottom tab navigation (mirrors Farmer pattern); single-column forms; tables collapse into stacked cards |
| Tablet (640–1024px)               | Product grids may expand to 2–3 columns where content allows; core flows unchanged                                                        | Sidebar navigation becomes available; tables remain tabular                                             |
| Desktop (> 1024px)                | Rarely used by farmers, but degrades gracefully — content centers in a constrained max-width column rather than stretching awkwardly wide | Full sidebar + multi-column dashboard layout, tables in full tabular form                               |

The Farmer experience is designed **mobile-first and mobile-only in practice** — desktop support is a graceful fallback, not a designed-for use case, consistent with the PRD's explicit focus on Android phone usage. The Owner experience is designed to work well on both, since the owner may use either a phone for quick checks or a larger device for end-of-day catalog/order review.

---

## 10. Empty, Loading, and Error States

A consistent pattern is applied across the entire application for these three states, so users encounter familiar visual language regardless of which screen they're on:

### 10.1 Empty States

Every empty state in the application follows the same three-part structure — **Illustration, Friendly Message, Recovery Action** — and none of the three are optional. The table below specifies all three for every empty state identified in this document, so implementation never has to guess at wording or omit the recovery step.

| Screen                                                 | Illustration                                      | Friendly Message                                                                  | Recovery Action                                                |
| ------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| F1 — Home (no categories yet)                          | Simple storefront/shop-getting-ready illustration | "The shop is getting ready — please check back soon."                             | None (nothing for the farmer to do; owner-side condition)      |
| F2 — Category Listing (no products in category)        | Empty basket/shelf illustration                   | "No products in this category yet."                                               | "Browse Other Categories" button → back to F1                  |
| F4 — Search Results (no matches)                       | Magnifying-glass-with-question-mark illustration  | "No products found for '[query]' — try a different search or browse by category." | "Browse Categories" button → F1                                |
| F5 — Cart (empty)                                      | Empty shopping bag illustration                   | "Your cart is empty."                                                             | "Start Shopping" button → F1                                   |
| F10 — My Orders (no history)                           | Empty receipt/clipboard illustration              | "You haven't placed any orders yet."                                              | "Browse Categories" button → F1                                |
| O3 — Sales Analytics (no data in range)                | Empty chart/graph illustration                    | "Not enough order data yet for this period."                                      | "Change Date Range" control, reset to a wider default range    |
| O4 — Product List (no products yet, new shop)          | Empty shelf/box illustration                      | "You haven't added any products yet."                                             | "+ Add Your First Product" button → O5                         |
| O6 — Category List (no categories yet, new shop)       | Empty tag/folder illustration                     | "You haven't created any categories yet."                                         | "+ Add Your First Category" button → O7                        |
| O8 — Order Queue (no orders in selected status filter) | Empty clipboard illustration                      | "No orders here right now."                                                       | "View All Orders" button, resetting the status filter to "All" |

**Design rule going forward:** any new empty state introduced in a future screen must be added to this table with all three fields defined before implementation — an empty state consisting of illustration and message alone, without a recovery action, is considered incomplete per this specification.

### 10.2 Loading States

- Skeleton placeholders (grey blocks matching the shape of real content) are used for initial listener/query loads, rather than a generic spinner, so the layout doesn't visually "jump" once real content arrives.
- Button-level loading (e.g., "Placing Order…" with a small inline spinner replacing the button label) is used for in-flight write operations, so the farmer/owner always has clear feedback that their tap registered.

### 10.3 Error States

- **Validation errors** (Section 11 below) are distinct from **system errors** (e.g., a failed network write). System errors are shown as a non-technical, reassuring inline message (e.g., "Something went wrong — please try again" for checkout submission failures) with a retry action, never a raw error code or stack trace.
- **Critical errors** (e.g., total loss of connectivity during checkout) are handled per Section 13 (Offline UX) rather than as a generic error state.

---

## 11. Form Validation UX

- **Inline, not preemptive.** Validation messages appear only after a field has been interacted with and left invalid (on blur, or on submit attempt) — never while the farmer is still mid-typing, which would be distracting and could feel punitive.
- **Plain-language messaging.** Every validation message is phrased as a farmer/owner would naturally think about the problem (e.g., "Please enter your phone number" rather than "Field 'customerPhone' is required"), directly reflecting the validation rules defined in Database.md Section 5.
- **Field-level, not form-level-only.** Errors appear directly beneath the specific field in question, so the user never has to scan an entire form to find what needs fixing.
- **Submit button never silently disabled.** Rather than greying out "Place Order"/"Save Product" until a form is perfectly valid (which can confuse users about why a button "doesn't work"), the button remains tappable at all times; tapping it while invalid surfaces the specific field errors immediately.
- **Real-time cross-field validation** where it matters most: the discount-price-vs-MRP check (O5) validates the moment both fields have a value, rather than waiting for form submission, since this is the validation rule most likely to represent a genuine owner mistake worth catching early.

---

## 12. Offline UX

Consistent with Architecture.md Section 8.5's deliberate design decision:

- **Reads degrade gracefully.** Catalog browsing (F1–F4) and the About the Shop screen (F12) continue to function from cached data when offline, with the slim inline banner described in F13 indicating the data may be stale.
- **Writes block clearly, rather than silently queuing.** Checkout (F6) and any owner-side write action (O5, O7, O9, O10) detect the offline condition and disable their primary action, replacing the button label with a clear "No internet connection — please try again" message. This is a deliberate trust-preserving choice: a farmer or owner should never wonder whether an action "went through" while disconnected.
- **Reconnection is handled transparently.** Once connectivity returns, the inline offline banner disappears automatically and any disabled write actions re-enable without requiring a manual page refresh.

---

## 13. PWA Installation Flow

- **No unsolicited install prompt on first visit.** Aggressively prompting a brand-new, possibly wary user to "install an app" before they've experienced any value is avoided.
- **Contextual prompt timing.** The install prompt is surfaced after a meaningful positive moment — specifically, after a farmer successfully completes their first order (on the Order Confirmation screen, F7) — framed as "Add AgriConnect to your home screen for faster access next time," directly tying the ask to a benefit the farmer has just experienced firsthand.
- **Owner installation** is handled more directly, since the owner is a committed, repeat user from day one — a simple "Install App" option is available in Shop Settings (O10) at any time.
- **Fallback for browsers without native install prompts:** a simple "Add to Home Screen" instructional graphic (browser-specific, e.g., Chrome's share-menu icon) is shown instead of relying solely on the native `beforeinstallprompt` event, since not all Android browser/OS combinations support it identically.

---

## 14. Telugu Localization Considerations

While English is the only shipped language in V1 (PRD FR-33), the following UI-level considerations are designed in now to avoid rework later:

- **No hardcoded string widths.** Layouts avoid fixed-width text containers that assume English's relatively compact character width — Telugu script can require more horizontal and vertical space per glyph, so buttons, labels, and cards use flexible, content-driven sizing rather than fixed pixel widths for text areas.
- **Icon-first design already reduces translation dependency.** Because Section 1's "image before text" principle is already core to the design, a future Telugu rollout primarily involves translating supporting labels/captions rather than redesigning icon-dependent navigation from scratch.
- **Font choice compatibility.** The system font stack chosen (Section 8.1) should be verified to include adequate Telugu glyph coverage before a Telugu rollout, or a supplementary Telugu-compatible web font should be scoped at that time — flagged here as a pre-requisite check for that future phase, not a V1 requirement.
- **Numeral and currency formatting.** Prices are already rendered via a centralized `PriceTag` component (Section 7) and quantities via `QuantityStepper` — both are logical, single points of future change if regional numeral conventions need adjustment, rather than being scattered across the codebase.
- **Bilingual transition period consideration.** If Telugu is introduced as an option alongside English (rather than a hard replacement), a simple language toggle would be added to F12/O10-adjacent settings — this is a straightforward additive UI element given the i18n-key architecture already established in Architecture.md Section 9.4.

---

## 15. Reusable UI Patterns

These patterns recur across multiple screens and are called out explicitly so they are built once and reused consistently, rather than redesigned per-screen:

1. **The Status Badge/Pill/Stepper family** (`AvailabilityBadge`, `StatusPill`, `StatusStepper`) all share the same underlying color-icon-label visual language (Section 2.2, Section 8.2) at three different levels of detail (compact badge, compact pill, full stepper) — establishing one consistent visual grammar for "state" throughout the entire app.
2. **The sticky bottom action bar** (seen on F3, F5, F6, O5) — a persistent, always-visible primary action anchored to the bottom of the viewport, ensuring the single most important action on any content-heavy screen is never lost to scrolling.
3. **The prefill-with-explanation pattern** (F6's returning-customer prefill) — whenever the system auto-fills data on the user's behalf, it is paired with a brief inline explanation of why, so users don't feel confused or surveilled by data appearing without their input.
4. **The confirm-before-destructive-action pattern** (F11/O9 cancellation, O9 owner-initiated cancellation with reason) — any action that cannot be easily undone requires an explicit secondary confirmation step, distinct from routine actions which do not.
5. **The card-list-with-quick-action pattern** (F2's product cards with a quick "+" add, O4's product rows with inline toggles) — list views throughout the app expose the single most common action directly on the row/card, reserving full navigation into a detail screen for less frequent actions.

---

## 16. Future UI Extensibility

Consistent with Architecture.md Section 12 ("Future Extensibility"), the following future capabilities are designed to be additive to this UI system, not disruptive to it:

- **Multi-shop discovery UI:** a new entry-point screen (shop directory/search) would sit above the existing Farmer navigation tree without altering it — once a shop is selected, the existing F1–F13 flow applies unchanged.
- **Online payments:** Checkout (F6) would gain a payment-method selection step and a payment-status element on the Order Confirmation (F7) and Order Detail (F11/O9) screens; the existing COD-only flow remains the default/fallback path rather than being removed.
- **WhatsApp notifications:** purely a backend/notification-channel addition; no new screens are required, though Shop Settings (O10) may eventually gain a notification-preferences toggle.
- **AI crop recommendations / chatbot:** would introduce new, clearly additive surfaces — e.g., a "Recommended for Your Crop" section on Home (F1) or a chat-style entry point reachable from the tab bar — designed as optional enhancements layered on top of the existing product browsing experience, not a replacement for it.
- **Voice ordering (Telugu):** would introduce a voice-input affordance on the Search Results screen (F4) and/or Home, additive to the existing text search rather than replacing it.
- **CSV/bulk product upload:** an additional entry point on the Product List screen (O4), alongside the existing "+ Add Product" action, reusing the same underlying product-creation logic in bulk.
- **Native Android/iOS app shells:** this entire design system (typography, color, spacing, component library) is platform-agnostic in its specification and can be carried directly into a native app wrapper without a visual redesign, per Architecture.md Section 8's PWA-to-native extensibility path.

---

## 17. Design Tokens

Design tokens formalize the values described narratively in Section 8 into a single named reference table — the intended source of truth that a future Tailwind config / CSS variable set would be generated from directly, ensuring the implementation never drifts from this specification.

### 17.1 Color Tokens

| Token                  | Value Direction                                               | Maps To (Section 8.2)                   |
| ---------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `color-primary-600`    | Deep green (base brand color)                                 | Primary Brand                           |
| `color-primary-700`    | Darker green (pressed/active state)                           | Primary Brand (pressed)                 |
| `color-primary-100`    | Pale green (subtle backgrounds, e.g., selected tab underline) | Primary Brand (tint)                    |
| `color-accent-500`     | Warm amber/gold                                               | Secondary/Accent                        |
| `color-success-500`    | Green (distinct from primary)                                 | Success                                 |
| `color-success-100`    | Pale green background                                         | Success (badge background)              |
| `color-warning-500`    | Amber                                                         | Warning                                 |
| `color-warning-100`    | Pale amber background                                         | Warning (badge background)              |
| `color-danger-500`     | Red                                                           | Danger/Critical                         |
| `color-danger-100`     | Pale red background                                           | Danger (badge background)               |
| `color-neutral-50`     | Off-white                                                     | Page background                         |
| `color-neutral-100`    | Light grey                                                    | Card background, dividers               |
| `color-text-primary`   | Near-black                                                    | Body copy                               |
| `color-text-secondary` | Mid-grey                                                      | Captions, metadata                      |
| `color-text-inverse`   | White                                                         | Text on filled buttons/dark backgrounds |

### 17.2 Typography Tokens

| Token                  | Size                    | Weight   | Maps To (Section 8.1)                                   |
| ---------------------- | ----------------------- | -------- | ------------------------------------------------------- |
| `font-size-display`    | 28–32px                 | Bold     | Display / Hero                                          |
| `font-size-page-title` | 22–24px                 | Semibold | Page Title                                              |
| `font-size-section`    | 18–20px                 | Semibold | Section Heading                                         |
| `font-size-body`       | 16px                    | Regular  | Body (minimum size floor — see Accessibility Checklist) |
| `font-size-caption`    | 14px                    | Regular  | Secondary/Caption                                       |
| `font-size-price`      | 20–22px                 | Bold     | Price (Emphasis)                                        |
| `font-family-base`     | System sans-serif stack | —        | All roles (Section 8.1)                                 |

### 17.3 Spacing Tokens

| Token      | Value | Typical Use                                                                 |
| ---------- | ----- | --------------------------------------------------------------------------- |
| `space-1`  | 4px   | Icon-to-label gap                                                           |
| `space-2`  | 8px   | Tight internal padding                                                      |
| `space-3`  | 12px  | Form field internal padding                                                 |
| `space-4`  | 16px  | Standard gap between tappable elements (accessibility minimum, Section 2.2) |
| `space-6`  | 24px  | Section-to-section spacing                                                  |
| `space-8`  | 32px  | Page-level top/bottom padding                                               |
| `space-12` | 48px  | Large hero/empty-state vertical spacing                                     |

### 17.4 Border Radius Tokens

| Token         | Value         | Typical Use                                |
| ------------- | ------------- | ------------------------------------------ |
| `radius-sm`   | 4px           | Input fields, small tags                   |
| `radius-md`   | 8px           | Cards, buttons                             |
| `radius-lg`   | 16px          | Modals, bottom sheets                      |
| `radius-full` | 9999px (pill) | Status badges/pills, avatar/circular icons |

### 17.5 Shadow Levels

| Token         | Elevation Intent | Typical Use                                              |
| ------------- | ---------------- | -------------------------------------------------------- |
| `shadow-none` | Flat             | Inline elements, list rows                               |
| `shadow-sm`   | Slight lift      | Product cards, dashboard stat cards                      |
| `shadow-md`   | Noticeable lift  | Sticky bottom action bars (Section 15.2), dropdown menus |
| `shadow-lg`   | Strong lift      | Modals, confirmation dialogs (Section 22)                |

### 17.6 Animation Duration Tokens

| Token              | Duration  | Typical Use                                                              |
| ------------------ | --------- | ------------------------------------------------------------------------ |
| `duration-instant` | 100ms     | Button press feedback (Section 20.6)                                     |
| `duration-fast`    | 150–200ms | Micro-interactions: quantity change, badge state change                  |
| `duration-base`    | 250–300ms | Screen transitions, modal open/close                                     |
| `duration-slow`    | 400–500ms | Success confirmation animations (Section 20.4), skeleton-to-content fade |

### 17.7 Transition Tokens

| Token                | Easing Curve Direction | Typical Use                                                                                                                   |
| -------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ease-standard`      | Ease-in-out            | Most UI transitions (default)                                                                                                 |
| `ease-decelerate`    | Ease-out               | Elements entering the screen (toasts, modals appearing)                                                                       |
| `ease-accelerate`    | Ease-in                | Elements leaving the screen (toasts, modals dismissing)                                                                       |
| `ease-bounce-subtle` | Slight overshoot       | Add-to-cart confirmation (Section 20.1), used sparingly and only for positive-feedback moments, never for routine transitions |

---

## 18. Component States

Every reusable component (Section 7) must support the full set of states below. A component is not considered complete for implementation until each applicable state has been explicitly designed, not left to default browser/library behavior.

### 18.1 Buttons (`PrimaryButton` / `SecondaryButton`)

- **Default** — resting appearance.
- **Pressed** — immediate visual feedback on tap (Section 20.6), using `duration-instant`.
- **Disabled** — visually muted, non-interactive (e.g., "Add to Cart" on an out-of-stock product, F3).
- **Loading** — label replaced with an inline spinner + in-progress text (e.g., "Placing Order…", Section 10.2).
- **Focus-visible** — a distinct outline for keyboard/assistive navigation (Section 19.4), never removed even when a mouse/touch style exists.

### 18.2 Product Cards (`ProductCard`)

- **Default** — standard image, name, price, availability badge.
- **Out-of-stock** — dimmed image treatment, "Currently Unavailable" replacing the quick-add "+" control (consistent with F3's detail-screen behavior).
- **Low-stock** — standard appearance plus the amber `AvailabilityBadge`, no other visual change (avoids over-alarming the farmer over a soft signal).
- **Loading (skeleton)** — grey placeholder block in the card's exact shape (Section 10.2).
- **Pressed** — subtle scale/opacity feedback on tap, consistent with the button press pattern (Section 20.6).

### 18.3 Inputs (text, phone, address fields)

- **Default (empty)** — placeholder text visible.
- **Focused** — clear focus ring (Section 19.4/19.6), keyboard type matched to content (numeric for phone, per Section 2.1).
- **Filled** — value visible, placeholder hidden.
- **Invalid** — red border/outline plus an `InlineFormError` beneath (Section 11), announced to assistive technology (Section 19.3/19.7).
- **Disabled** — muted appearance, used rarely (e.g., a field locked after order confirmation).
- **Prefilled (returning customer)** — a distinct subtle highlight or inline note the first time the value appears, per the prefill-with-explanation pattern (Section 15.3), clearing after the farmer interacts with the field.

### 18.4 Quantity Stepper (`QuantityStepper`)

- **Default** — current quantity visible, both − and + controls active.
- **Minimum reached** (qty = 1 for farmers, since 0 means "remove," handled instead by the cart's remove action) — the − control is disabled/visually muted rather than allowing a 0 state to persist silently.
- **Changing** — a brief `duration-fast` scale/highlight animation on the number itself when it updates (Section 20.2), giving clear feedback that the tap registered.
- **Owner-adjustment mode (O9)** — visually distinguished (e.g., a subtle "editing" border) from the farmer-facing read-only quantity display elsewhere on the same order.

### 18.5 Status Badges (`AvailabilityBadge`, `StatusPill`, `StatusStepper`)

- **Available / Placed / Confirmed / etc. (each defined state)** — its own fixed color + icon + label combination (Section 2.2, Section 8.2), never dynamically mixed.
- **Transitioning** — when an order's status changes while a farmer/owner has the detail screen open (F11/O9), the `StatusStepper` animates the highlighted stage moving forward using `duration-base`, rather than snapping instantly, so the change is noticeable rather than easy to miss.
- **Compact vs. full** — `StatusPill` (list context) and `StatusStepper` (detail context) always render the same underlying status using the same color/icon/label triplet, differing only in layout density (Section 15.1).

### 18.6 Image Carousel (`ImageCarousel`)

- **Default** — cover image (`isCover: true`) shown first, dot indicators visible.
- **Single image only** — dot indicators and swipe/tap-zones are hidden entirely rather than shown non-functionally, since a single-image product has nothing to navigate between.
- **Loading** — skeleton block in place of the image area until the first image resolves.
- **Failed to load** — a neutral placeholder image (not a broken-image browser icon) with no error message shown to the farmer, since a missing product image is a low-severity, owner-side data issue, not something the farmer needs to be alarmed by.
- **Active dot / inactive dot** — clear visual distinction so position within the gallery is always legible at a glance.

---

## 19. Accessibility Checklist

This checklist operationalizes Section 2.2's accessibility considerations into concrete, verifiable implementation requirements.

### 19.1 Minimum Touch Targets

- All interactive elements (buttons, tab items, form controls, card quick-actions) meet a minimum of 44×44px, with at least `space-4` (16px) of clear spacing to the next adjacent tappable element.
- Icon-only controls (e.g., cart remove icon on F5) are given an invisible padded tap area meeting the 44×44px minimum even where the visible icon itself is smaller.

### 19.2 Keyboard Navigation

- Every interactive element is reachable and operable via keyboard alone (Tab/Shift+Tab to move, Enter/Space to activate), relevant primarily to the Owner console's desktop use case (Section 9).
- Tab order follows visual/logical reading order on every screen; no element is keyboard-reachable out of visual sequence.
- Modal/dialog components (Section 22.6) trap focus within themselves while open and return focus to the triggering element on close.

### 19.3 Screen Reader Support

- Every image (product photos, shop photo, icons conveying meaning) has a meaningful `alt` description; purely decorative icons paired with a visible text label are marked so screen readers don't announce redundant information.
- Dynamic content updates (cart item count, order status changes, form errors) are announced via appropriate live-region behavior (Section 19.7) rather than silently updating on-screen only.
- The `StatusStepper`/`StatusPill` components expose their current state as readable text to assistive technology, not merely as a color/icon combination.

### 19.4 ARIA Guidelines

- Semantic HTML elements are used as the first choice (`<button>`, `<nav>`, `<form>`) before reaching for ARIA roles, consistent with standard accessible-by-default practice.
- ARIA roles/attributes are applied only where semantic HTML is insufficient — e.g., the `OTPInput` component's individually boxed digits are grouped with an appropriate group role and label so they read as one logical field, not four disconnected ones.
- Custom components built on Shadcn primitives inherit and preserve the underlying primitives' existing ARIA behavior rather than overriding it.

### 19.5 Focus Management

- Focus moves predictably on navigation: opening a modal/dialog moves focus into it; closing it returns focus to the triggering control; navigating between screens resets focus to the new screen's primary heading or first interactive element.
- Focus is never silently lost (e.g., to `<body>`) after an element is removed from the DOM (such as a dismissed toast or a completed loading state).

### 19.6 Color Contrast

- All body text maintains a minimum 4.5:1 contrast ratio against its background (Section 2.2), verified for both the primary green brand palette and the status colors (Section 8.2/17.1) in their actual paired combinations (e.g., white text on `color-primary-600`, not just each color checked in isolation).
- Status badge text-on-background-tint combinations (e.g., `color-warning-500` text on `color-warning-100` background) are explicitly contrast-checked, since tinted badge backgrounds are a common place for contrast to silently fail.

### 19.7 Error Announcements

- Form validation errors (Section 11) are associated with their field via appropriate labeling so a screen reader announces the error immediately when it appears, not only if the user happens to navigate directly to the error text.
- System-level errors (Section 10.3) and confirmation dialogs (Section 22.6) are announced via an assertive live region, since these represent state changes the user must be made aware of regardless of where their focus currently is.
- Non-critical status changes (e.g., a successfully saved product, Section 22.1) use a polite (non-interrupting) announcement, reserving assertive announcements for errors and critical confirmations only.

---

## 20. Micro-interactions

Micro-interactions provide the moment-to-moment feedback that makes the app feel responsive and trustworthy, using the duration/easing tokens defined in Section 17.6/17.7.

### 20.1 Add-to-Cart Animation

- On tapping "Add to Cart" (F3) or a card's quick-add "+" (F2), the cart tab icon briefly scales up and back down (`duration-fast`, `ease-bounce-subtle`) while its item-count badge increments, giving clear, celebratory-but-not-excessive confirmation that the action registered — without navigating the farmer away from what they were browsing.

### 20.2 Quantity Changes

- Tapping − or + on the `QuantityStepper` (F3, F5) triggers a brief scale/highlight pulse (`duration-fast`, `ease-standard`) on the numeral itself as it updates, and the line/subtotal price recalculates with a quick cross-fade rather than an abrupt jump.

### 20.3 Loading Skeletons

- Skeleton placeholders (Section 10.2, Section 18.2/18.6) use a subtle shimmer/pulse animation (`duration-slow`, looping) rather than a static grey block, signaling active loading rather than a potentially broken/stalled state.
- The transition from skeleton to real content uses a quick cross-fade (`duration-base`) rather than an abrupt swap, avoiding a jarring "pop."

### 20.4 Success Animations

- Order Confirmation (F7) plays a one-time success animation (e.g., a checkmark draw-in or gentle scale-in, `duration-slow`, `ease-decelerate`) on the success icon — used only for this single, meaningful moment in the Farmer journey, not for every minor confirmation, to preserve its emotional weight.
- Owner-side "Saved" confirmations (O5, O7, O10) use a much lighter touch — a brief checkmark flash within the snackbar itself (Section 22) rather than a full-screen animation, appropriate to a routine, repeated action.

### 20.5 Pull-to-Refresh

- Supported on the primary listener-backed list screens where a farmer/owner might reasonably want to force a manual refresh: F2 (Category Listing), F10 (My Orders history), O8 (Order Queue). Not needed on screens already backed by an always-live Firestore real-time listener where content updates automatically (Section 6.3 of Architecture.md) — pull-to-refresh is offered as a reassurance gesture on these specific screens primarily for farmers/owners on an intermittent connection who want explicit confirmation that they've seen the latest data.
- Uses a standard elastic pull gesture with a spinner that releases into a brief `duration-fast` settle animation once new data has loaded.

### 20.6 Button Press Feedback

- Every button (Section 18.1) provides immediate (`duration-instant`) visual feedback on press — a slight scale-down and/or background darkening — before any async action (network write, navigation) resolves, so the farmer/owner always has instant confirmation that their tap was registered by the device, independent of network latency.

---

## 21. Notification UX

A consistent hierarchy of notification patterns is used throughout, chosen based on urgency and whether the message requires the user's explicit acknowledgment.

### 21.1 Success Notifications

- Brief, auto-dismissing **snackbars** (Section 21.5) for routine confirmations (e.g., "Product saved," "Category updated," O5/O7/O10) — polite, non-blocking, and self-dismissing after a few seconds.
- The single exception is Order Confirmation (F7), which is a full dedicated screen rather than a transient notification, given its significance as the culmination of the entire farmer ordering journey (Section 20.4).

### 21.2 Error Notifications

- System-level errors (Section 10.3) that don't block the whole screen (e.g., a failed background image upload during product editing) appear as a snackbar in the danger color token (`color-danger-500`/`color-danger-100`), with a "Retry" action where applicable, and do not auto-dismiss as quickly as success snackbars — giving the user enough time to notice and act.
- Errors that fully block a critical action (e.g., checkout failing to submit) are shown inline on the screen itself (Section 11), not merely as a passing snackbar, since a farmer must not be able to miss why their order didn't go through.

### 21.3 Warning Messages

- Used for non-blocking but noteworthy conditions — e.g., an owner attempting to deactivate a category that still has active products receives an inline warning banner (amber, `color-warning-500`/`color-warning-100`) explaining the consequence, before they confirm.
- Warnings never auto-dismiss on their own, unlike success snackbars, since they require the user to make a conscious choice rather than simply being informed.

### 21.4 Offline Banners

- The slim, persistent inline banner described in Section 12/F13 ("You're offline — showing saved information") uses the neutral/warning token palette (not danger red, since offline is an expected, non-catastrophic condition) and remains visible for the full duration of the offline state, disappearing automatically the moment connectivity is restored — it does not auto-dismiss on a timer the way a snackbar would, since the underlying condition it describes may still be true.

### 21.5 Snackbars

- Positioned consistently at the bottom of the viewport (above the bottom tab bar on the Farmer app, above any sticky action bar), auto-dismissing after approximately 3–4 seconds for success messages and slightly longer for error messages with a retry action.
- Only one snackbar is shown at a time; a new snackbar replaces rather than stacks on top of an existing one, avoiding visual clutter on a small screen.

### 21.6 Confirmation Dialogs

- Reserved specifically for the confirm-before-destructive-action pattern (Section 15.4) — cancelling an order (F11, O9) and deactivating a category with active products (O6) are the two primary V1 examples.
- Presented as a modal (using `shadow-lg`/`radius-lg` tokens, Section 17.4/17.5) that dims the background and requires an explicit choice (e.g., "Yes, Cancel Order" / "No, Keep Order") — never dismissible by accidental outside-tap alone for destructive confirmations specifically, to prevent an unintended tap from silently cancelling a real order.
- Focus is trapped within the dialog while open (Section 19.5) and returned to the triggering button when dismissed.

---

**Document Status:** Approved. No application code has been generated as part of this document, per instruction. This document, together with PRD.md, Architecture.md, and Database.md, provides the complete design foundation needed before implementation begins.
