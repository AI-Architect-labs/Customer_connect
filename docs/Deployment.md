# Production Deployment Guide

## 1. Prerequisites

- Firebase CLI authenticated (`firebase login`).
- Three recommended Firebase projects: dev, staging, production.
- Blaze billing enabled before deploying Cloud Functions.
- Budget alerts configured in Google Cloud Billing.
- Real owner provisioned with `scripts/bootstrap_owner.py`.
- Firestore, Storage, Authentication providers and Cloud Messaging configured.

## 2. Required public environment variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_DEFAULT_SHOP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false
```

Firebase Web configuration is public by design; security relies on Auth, Security Rules, Cloud Functions, and App Check. Never expose service-account/Admin credentials to the client.

## 3. Firebase Console configuration

Authentication:

- Enable Anonymous.
- Enable Email/Password.
- Enable Phone.
- Configure authorized domains and SMS/reCAPTCHA settings.

Firestore/Storage:

- Create the database/Storage bucket in the chosen region.
- Deploy `firestore.rules`, `storage.rules`, and `firestore.indexes.json` before loading real data.

Cloud Messaging:

- Create a Web Push certificate and set its public VAPID key in `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

App Check:

- Register the web app with reCAPTCHA.
- Set `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`.
- Verify staging traffic first.
- Set Functions environment `ENFORCE_APP_CHECK=true` only after valid App Check tokens are confirmed.

## 4. Verification before deployment

```bash
npm run setup
cp .env.local.example .env.local
# fill real staging values
npm run verify
npm run test:rules
```

Also complete the manual journeys in the PRD: farmer browse/order, returning farmer, phone-verified history/cancellation, owner catalog, owner order lifecycle, and analytics.

## 5. Deploy staging

Replace the placeholder ids in `.firebaserc`, then:

```bash
firebase use staging
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
firebase deploy --only hosting
```

The repository uses Firebase's Next.js framework-aware Hosting `source` configuration. If the Firebase CLI version requests enabling web-framework support, follow the CLI prompt in staging and validate the generated backend before production.

## 6. Production gate

Do not deploy production until:

- CI is green.
- Rules tests pass.
- No Critical/High defects are open.
- Owner mapping and shop profile are correct.
- App Check staging verification is successful.
- Owner receives a real push notification.
- A real Android phone completes the full COD order flow.
- Shop owner performs and signs off on an end-to-end acceptance order.

Then:

```bash
firebase use prod
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
firebase deploy --only hosting
```

## 7. Rollback

- Hosting: roll back/release a prior Hosting version in Firebase Console/CLI.
- Functions: redeploy the previous Git tag/release commit.
- Rules: deploy the previous version-controlled rules files.
- Database: prefer additive migrations; do not run destructive migrations without an export/backfill plan.
