# Release Notes — Sprint 1 (v0.1.0-alpha)

**Release Tag:** `v0.1.0-alpha` (per DevelopmentPlan.md §13's release milestone table)
**Scope:** Sprint 1 — Authentication & Identity Layer
**Audience:** Internal only — no visible product yet (matches DevelopmentPlan.md's planned milestone description exactly)

---

## Summary

Sprint 1 delivers the complete authentication and identity foundation the rest of the product builds on: the three-tier identity model (Anonymous → Phone-linked → Owner) from Architecture.md §5 is now real, tested infrastructure, not just a design document.

## What's New

### Shared Authentication Infrastructure

- Full session-tier resolution (`unauthenticated` / `anonymous` / `phone-linked` / `owner`), backed by a live Firebase Auth state observer and an `owners/{uid}` Firestore lookup.
- `useAuth()`, `RequireOwner` (protected-route component), and `useRequireOwner()` (protected-route logic without the redirect side effect) available app-wide.
- The first real Firestore Security Rule (`owners/{ownerUid}` — owner-only read/write), replacing the deny-all baseline for that one collection.

### Owner Sign-In

- `/login` — a fully accessible, validated email/password sign-in form.
- `/dashboard` — a temporary protected page (until Sprint 2's real Dashboard) proving the full loop: unauthenticated visit → redirect to login → successful login → redirect to dashboard → logout → redirect back to login.
- Friendly, deliberately non-specific error messages for invalid credentials (a security best practice, not an oversight) — verified against real Firebase Auth Emulator error codes.

### Farmer Anonymous Identity

- Every session now silently and automatically establishes an anonymous Firebase identity on first load — no prompt, no visible UI.
- Verified session continuity: reopening the app reuses the same anonymous identity rather than creating a new one every time.
- A tested "upgrade path" primitive (`linkPhoneCredentialToCurrentUser`) ready for Sprint 6's phone-verification screens to call, preserving the farmer's original identity (and everything eventually tied to it) through the upgrade.

## Known Limitations (By Design, On Schedule)

- No farmer-facing product browsing yet (Sprint 4).
- No phone OTP send/verify UI yet (Sprint 6) — see `PROJECT_STATE.md` §5 for why this was deliberately deferred from the original Sprint 1 scope.
- `/` and `/dashboard` are temporary internal verification pages, not final product screens.

## Upgrade / Setup Notes

No migration necessary — this is the first functional release. To try it locally, see `README.md`'s "Getting Started" and "Firebase Setup" sections.

## Full Verification & Testing Detail

See `VERIFICATION_REPORT.md` and `MANUAL_TESTING_REPORT.md` in this same folder for the complete, itemized verification evidence behind this release.
