# AI Context — AgriConnect

AgriConnect is a real V1 agricultural-commerce PWA for one local shop, structurally multi-shop ready. Farmers browse and place COD orders with no mandatory login; phone OTP is required only for private order history/cancellation. The owner manages the shop/catalog/orders through an authenticated console.

## Read first

- `PROJECT_STATE.md` — exact current state and remaining verification/deployment work.
- `docs/PRD.md` — approved requirements.
- `docs/Architecture.md` / `docs/Database.md` / `docs/UI_UX.md` — original approved design.
- `docs/ImplementationSecurityAddendum.md` — implementation-time security and route refinements that intentionally supersede a few original implementation details.
- The nearest directory `README.md` before changing a module.

## Non-negotiable invariants

- Never allow a client to create/claim `owners/{uid}`.
- Never trust client-submitted prices/subtotals; order financial data is computed by Cloud Functions from product records.
- Never make customer records or order history publicly readable.
- Never bypass phone verification for cross-session farmer order history/cancellation.
- Never weaken Firestore/Storage rules to make UI development easier.
- Never put service-account/Admin credentials in the client or repository.
- Preserve COD-only V1 scope unless the PRD is explicitly revised.
- Preserve the dependency direction: route/UI → feature → service → repository/Firebase adapter. Trusted financial/order mutations go through Functions.
- Keep farmer UX mobile-first, low-reading-load, large-target and English-first/Telugu-ready.

## Current stack

Next.js 16, React 19, TypeScript strict, Tailwind 3.4, Firebase Auth/Firestore/Storage/Functions/FCM/App Check, Zustand, React Hook Form, Zod, Vitest, Firebase Emulator Suite, GitHub Actions.

Do not claim the expanded V1 is fully verified until `PROJECT_STATE.md`'s remaining dependency-backed verification gates have actually passed.
