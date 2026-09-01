# Sprint 1 — Manual Testing Report

**Scope:** Milestones 1.1, 1.2, 1.3
**How to reproduce:** `npm run emulators` in one terminal, `npm run dev` in another, then follow each test case below.

---

## Owner Login Flow

| #   | Test Case                               | Expected Result                                                                                          | Status                                                                                                              |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Visit `/dashboard` while signed out     | Redirected to `/login`                                                                                   | Verified (Milestone 1.2)                                                                                            |
| 2   | Submit login form with empty email      | Inline error under email field, focus moves there, no network call                                       | Verified                                                                                                            |
| 3   | Enter invalid email format, tab away    | Inline error appears on blur, not while typing                                                           | Verified                                                                                                            |
| 4   | Fix email, leave password empty, submit | Focus moves to password field's error                                                                    | Verified                                                                                                            |
| 5   | Submit with wrong credentials           | Button shows "Signing in…", then red inline banner with friendly error; top loading bar shows then hides | Verified                                                                                                            |
| 6   | Submit with correct credentials         | Redirected to `/dashboard`, shows owner's display name and shop ID                                       | Verified                                                                                                            |
| 7   | Click "Log Out" on dashboard            | Redirected back to `/login` automatically                                                                | Verified                                                                                                            |
| 8   | Screen reader on login form             | Labels, error announcements (`role="alert"`), submit button state all announced                          | Verified structurally (ARIA attributes present); not tested with an actual screen reader device in this environment |

## Session & Protected Routing

| #   | Test Case                                                                                           | Expected Result                                                                        | Status                                                                       |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 9   | Wrap test component in `<RequireOwner redirectTo="/nonexistent-test-route">` with no signed-in user | Redirects to the specified route                                                       | Verified (Milestone 1.1)                                                     |
| 10  | Call `useAuth()` outside `AuthProvider`                                                             | Throws `"useAuth must be used within an AuthProvider."`                                | Verified                                                                     |
| 11  | Visit the app fresh (no prior session)                                                              | Session resolves to `tier: 'anonymous'` automatically, visible in the `/` status panel | Verified (Milestone 1.3, both via emulator script and rendered page content) |
| 12  | Reload the app after an anonymous session was already established                                   | Same UID persists — no new anonymous account created                                   | Verified via emulator script                                                 |

## Accessibility Spot-Checks

| #   | Test Case                                                    | Expected Result                                                                                                                 | Status                                                                                 |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 13  | Tab through the login form using only the keyboard           | Logical tab order: email → password → submit button                                                                             | Verified structurally (standard DOM order, no `tabIndex` overrides)                    |
| 14  | Check color contrast of error text against its background    | Meets the 4.5:1 minimum per UI_UX.md §19.6 (uses the existing `destructive` design token, already contrast-checked in Sprint 0) | Verified by reuse of pre-established tokens, not re-measured independently this sprint |
| 15  | Check touch target size of the submit button and form inputs | All inputs/buttons are `h-11` (44px), meeting the UI_UX.md §19.1 minimum                                                        | Verified by code inspection                                                            |

## Known Gaps in This Testing Pass

- No testing performed on a real physical Android device this sprint (recommended before Sprint 9's final hardening pass, per DevelopmentPlan.md's per-sprint testing strategy).
- No real screen-reader device testing (e.g., TalkBack) — ARIA structure was verified by inspection, which is a weaker guarantee than an actual assistive-technology pass.
- Firestore rules manual test cases (owner reads/writes own doc; a different session is denied) were run once during Milestone 1.1 but not re-run at Sprint 1's close — see `VERIFICATION_REPORT.md` §2.3 and `PROJECT_STATE.md` §6.
