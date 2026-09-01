# Security Policy

## Reporting

Report vulnerabilities privately to the repository owner. Do not open a public issue containing exploit steps, customer data, credentials, or service-account material.

## Security invariants

1. **Tenant ownership comes from server-provisioned `owners/{uid}` mappings.** Browser clients cannot create/update those mappings.
2. **Client prices are untrusted.** `createOrder` loads products and computes order prices/subtotal in Cloud Functions using Admin SDK.
3. **Order/customer writes are server-authoritative.** Firestore rules deny direct client mutations for these collections.
4. **Order history is private.** Owner access is shop-scoped; farmer access requires Firebase phone verification matching `customerPhone`.
5. **Customer prefill is not publicly queryable.** It is returned only to the same persistent Firebase identity or the matching phone-verified identity.
6. **Storage uploads are owner-only, image-only and limited to <5 MB by rules.**
7. **Deny by default.** Any Firestore/Storage path without an explicit grant remains denied.
8. **Admin credentials never enter the browser or Git repository.** `.gitignore` blocks common service-account/key names; review commits anyway.
9. **App Check must be validated and enforced before production.** Functions use `ENFORCE_APP_CHECK=true` as the production switch.
10. **Order abuse is rate-limited** server-side per Firebase UID in addition to App Check/authentication.

## Required tests for security-affecting changes

- Both success and failure cases in `tests/rules/` for Security Rule changes.
- Unit tests for validation/business calculations.
- Emulator tests for auth/data access.
- Manual verification for OTP, owner access, image upload, cancellation and FCM when those flows change.

## Secrets

Allowed in source: Firebase **Web SDK public configuration**.

Never commit:

- Firebase service-account JSON.
- private keys / `.pem` / `.key` files.
- OAuth client secrets.
- production customer exports.
- real `.env.local` files.
- Admin SDK credentials.

See `.gitignore` and `docs/Deployment.md`.
