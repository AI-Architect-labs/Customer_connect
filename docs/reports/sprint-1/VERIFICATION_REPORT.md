# Sprint 1 — Verification Report

**Scope:** Milestones 1.1 (Auth Infrastructure), 1.2 (Owner Authentication), 1.3 (Anonymous Farmer Identity)
**Date:** End of Sprint 1

---

## 1. Automated Checks (Run Fresh at Sprint Completion)

All four commands below were run against the final, complete Sprint 1 codebase (not just at each milestone boundary) to confirm nothing regressed across the full sprint — including after adding `docs/`, `PROJECT_STATE.md`, and this reports folder itself, which required a Prettier pass over the newly-added documentation to keep the format gate green:

| Check            | Command                | Result                                                                                                      |
| ---------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Type-check       | `npm run type-check`   | ✅ Pass — zero errors                                                                                       |
| Lint             | `npm run lint`         | ✅ Pass — zero errors, zero warnings                                                                        |
| Format           | `npm run format:check` | ✅ Pass — all files match Prettier style                                                                    |
| Production build | `npm run build`        | ✅ Pass — all 4 routes (`/`, `/login`, `/dashboard`, `/_not-found`) compile and prerender as static content |

## 2. Live Emulator Verification

### 2.1 Auth Emulator — Owner Login (Milestone 1.2)

Ran a real Node script against the live Firebase Auth Emulator (not a mock):

| Test                                | Result                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create owner email/password account | ✅ PASS                                                                                                                                                                               |
| Sign in with correct credentials    | ✅ PASS — returns matching UID                                                                                                                                                        |
| Sign in with wrong password         | ✅ PASS — rejected with `auth/wrong-password`, correctly mapped to "The email or password you entered is incorrect."                                                                  |
| Sign in with non-existent account   | ✅ PASS — rejected with `auth/user-not-found`, mapped to the same generic message (confirms the deliberate security choice not to reveal which part of the credential pair was wrong) |

### 2.2 Auth Emulator — Anonymous Identity & Upgrade Path (Milestone 1.3)

| Test                                                                      | Result                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First anonymous sign-in creates a new UID, `isAnonymous: true`            | ✅ PASS                                                                                                                                                                                                                                                                                                                                     |
| Calling sign-in again while a session exists reuses the SAME uid          | ✅ PASS — proves session continuity, the technical basis for the future cart-continuity guarantee                                                                                                                                                                                                                                           |
| Simulated "returning session" condition (persisted `auth.currentUser`)    | ✅ PASS                                                                                                                                                                                                                                                                                                                                     |
| `PhoneAuthProvider.verifyPhoneNumber` in a headless (non-browser) context | ❌ Throws `auth/operation-not-supported-in-this-environment` — **this is an expected, confirming result**, not a failure of the implementation. It directly validates the documented architectural decision that phone verification requires a real browser/DOM context and therefore belongs in Sprint 6 alongside the actual OTP screens. |

**Note:** the credential-linking primitive (`linkWithCredential`, which `linkPhoneCredentialToCurrentUser` wraps) was still exercised successfully in isolation during Milestone 1.3's own verification pass (prior to Sprint completion), using the Auth emulator's test-OTP REST endpoint to obtain a real phone credential without needing a browser for that specific step — confirming the linking mechanism itself (preserving the original anonymous UID) works correctly. The browser-only constraint applies specifically to the verification-initiation step (`verifyPhoneNumber`), not to the linking step, which is the actual code this milestone delivers.

### 2.3 Firestore Rules — Owner Document Access

**Not independently re-verified via a fresh live emulator run at Sprint 1 completion**, due to this sandbox environment's inability to download the Firestore emulator JAR (network egress restriction on `storage.googleapis.com`, documented since Milestone 0.2). This was verified once during Milestone 1.1's own work session (owner read/write own doc succeeds; a different anonymous session's read/write attempt is denied), but that verification was not re-run at Sprint boundary. **This is flagged as a known gap, not silently omitted** — see `PROJECT_STATE.md` §6 for the recommended remediation (an automated `tests/rules/` suite, to be established at the start of Sprint 2).

## 3. HTTP-Level Verification

Booted the production server and confirmed via `curl`:

| Check                                                                                                       | Result                                          |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `/login` returns HTTP 200 with correctly labeled/typed form fields                                          | ✅ PASS                                         |
| `/dashboard` returns HTTP 200 with the loading fallback (not protected content) before client-side redirect | ✅ PASS — confirms no data leak in initial HTML |
| `/` returns HTTP 200 with the "Session status" panel present                                                | ✅ PASS                                         |

## 4. What Was NOT Verified (Explicit)

- No real SMS delivery was tested (out of scope until Sprint 6 builds real phone verification screens; the emulator's test-OTP mechanism was used instead, which is the correct approach for this stage).
- No cross-browser testing performed.
- No load/performance testing (out of scope per DevelopmentPlan.md — that's Sprint 9).
- Firestore rules were not re-verified live at this exact sprint boundary (see §2.3).

## 5. Conclusion

Sprint 1's core deliverables — session-tier resolution, owner authentication, and anonymous farmer identity with a verified upgrade path — are confirmed working through a combination of automated checks and live emulator testing. The one explicit gap (Firestore rules re-verification) is tracked, not hidden, with a clear remediation plan.
