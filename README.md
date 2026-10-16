# Milestones & Meaning

Website for **Milestones & Meaning**, a life-transition and relationship support practice.

## Requirements

- Node.js 24
- npm
- Java 21 or later — required by the Firestore emulator

## Setup

Install dependencies:

```bash
npm ci
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Fill in the Firebase configuration values in `.env.local`.

Start the full local development environment:

```bash
npm run dev:local
```

This starts:

- Firebase Authentication emulator
- Firestore emulator
- Firebase emulator seed data (admin accounts, pages, and services)
- 65 demonstration payment records
- Next.js development server

Open the website:

```text
http://localhost:3000
```

The Firebase Emulator UI is available at:

```text
http://127.0.0.1:4000
```

### Local Test Accounts

The Firebase emulator is automatically seeded with development-only accounts.

```text
Admin
Email: admin@example.com
Password: Admin123!

Regular user
Email: user@example.com
Password: User123!
```

These accounts exist only in the local Firebase emulator and must not be used in production.

### Local Payment Demo Data

The local development environment automatically creates 65 demonstration payments to populate the administrator's payment history.

The sample payments include:

- Successful payments
- Partially refunded payments
- Fully refunded payments
- Different customers and purchased services
- Payment records spanning multiple dates

The payment data is defined in:

`./scripts/seed-data/payment-demo-data.js`

The executable seed script is:

`./scripts/seed-payments-emulator.mjs`

To seed payment records independently while the Firestore emulator is running:

```bash
npm run firebase:seed:payments
```

The seed script connects exclusively to the local Firestore emulator at `127.0.0.1:8080`.

Each demonstration payment uses a fixed document ID, so running the script repeatedly replaces the same records instead of creating duplicates. Existing unrelated payment records are not modified.

The records are fictional and do not represent real Stripe transactions. They do not contain real Stripe payment references.

To view the populated payment history:

1. Start the development environment with `npm run dev:local`.
2. Sign in using the local administrator account.
3. Visit `http://localhost:3000/admin/payments`.

The payment history currently displays up to 50 recent payment records.

The demo data is intended only for local development. Do not run the payment seed against production Firestore.

### Stripe Development Configuration

Stripe Checkout is implemented using server-side API requests.

The following environment variables are used:

| Variable                | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `STRIPE_SECRET_KEY`     | Authenticates server-side Stripe API requests          |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhook signatures            |
| `APP_URL`               | Defines the application's origin for payment redirects |
| `CRON_SECRET`           | Protects the payment reconciliation endpoint           |

For local development, configure:

```env
APP_URL=http://localhost:3000
```

Stripe sandbox payment testing requires a valid sandbox secret key (`sk_test_`). The publishable key (`pk_test_`) cannot create Checkout Sessions through the current backend integration.

Without the sandbox secret key, developers can still test the admin dashboard, Firestore records, and automated payment logic using mocks and emulator data. Real Stripe sandbox Checkout Sessions, test-card purchases, and webhook delivery remain unverified.

Never commit actual Stripe keys or webhook secrets. Store development credentials in `.env.local` and production credentials in the hosting provider's secret manager.

### Production Page Bootstrap

Local page content is seeded from:

`./scripts/seed-data/pages.js`

To populate the initial production Firestore `pages` collection, use:

`./scripts/migrations/populate-production-pages.mjs`

Create a temporary `.env.production-migration.local` file:

```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=milestones-and-meaning
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@milestones-and-meaning.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

Do not include Firebase emulator variables in this file.

Run a dry run first:

```bash
node --env-file=.env.production-migration.local scripts/migrations/populate-production-pages.mjs
```

A successful dry run should end with:

```text
[DRY RUN] Would populate pages/grief-support
[DRY RUN] Would populate pages/funeral
...
Dry run complete. No production data was changed.
Run again with --write when you are ready.
```

Node may also display a `MODULE_TYPELESS_PACKAGE_JSON` warning before this output because the seed data file uses ES module syntax. This warning does not mean the migration failed.

If the dry-run output is correct, run the migration:

```bash
node --env-file=.env.production-migration.local scripts/migrations/populate-production-pages.mjs --write
```

A successful production migration should end with:

```text
Populated pages/grief-support
Populated pages/funeral
...
Production page migration complete.
```

After verifying the documents in Firestore, delete the temporary environment file:

```bash
rm .env.production-migration.local
```

> This script is intended only to bootstrap the initial production page data. It is not a development-to-production sync tool. Future production data changes should use their own migration when needed.

## Commands

| Command                            | Description                                         |
| ---------------------------------- | --------------------------------------------------- |
| `npm run dev`                      | Start only the Next.js development server           |
| `npm run dev:local`                | Start emulators, seed local data, and start Next.js |
| `npm run firebase:emulators:start` | Start Firebase emulators manually                   |
| `npm run firebase:seed`            | Seed local authentication, pages, and services      |
| `npm run firebase:seed:payments`   | Seed 65 local demonstration payments                |
| `npm run build`                    | Create a Next.js production build                   |
| `npm run build:cloudflare`         | Create a Cloudflare Workers build                   |
| `npm run preview`                  | Preview the Cloudflare Workers build locally        |
| `npm run lint`                     | Run ESLint                                          |
| `npm run format`                   | Format with Prettier                                |
| `npm run format:check`             | Check formatting                                    |
| `npm test`                         | Run Jest tests                                      |
| `npm run test:e2e`                 | Run Playwright tests                                |

## Testing

Unit and component tests use **Jest + React Testing Library**.

End-to-end tests use **Playwright**.

Firebase emulator integration tests validate payment persistence, transaction behavior, and refund synchronization.

Before opening a pull request, run:

```bash
npm run format:check
npm run lint
npm test
npm run test:e2e
npm run build
npm run build:cloudflare
```

Stripe-specific end-to-end tests must also be completed using the actual Stripe sandbox credentials before enabling production payments.

## CI

GitHub Actions runs formatting, linting, tests, and the production build on pull requests and pushes to `main`.

## Deploying to Cloudflare

The site runs on Cloudflare Workers through the [OpenNext adapter](https://opennext.js.org/cloudflare). Worker settings live in `wrangler.jsonc`.

Cloudflare Workers Builds settings:

| Setting        | Value                              |
| -------------- | ---------------------------------- |
| Build command  | `npx opennextjs-cloudflare build`  |
| Deploy command | `npx opennextjs-cloudflare deploy` |

Variables:

- **Build variables:** The six `NEXT_PUBLIC_FIREBASE_*` values. Next.js inlines them at build time.
- **Firebase runtime secrets:** `FIREBASE_ADMIN_CLIENT_EMAIL` and `FIREBASE_ADMIN_PRIVATE_KEY`. The private key can be pasted with real line breaks or with `\n`.
- **Stripe runtime secrets (when payment integration is activated):** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- **Application configuration:** `APP_URL` must be set to the production website origin.
- **Reconciliation authentication:** `CRON_SECRET` is required when invoking the protected payment reconciliation endpoint.

Keep sandbox and production Stripe credentials separate.

To try the Workers build locally, run `npm run preview`. Put runtime values in a `.dev.vars` file, which is git-ignored.

### Payment Reconciliation Scheduling

The application includes a protected payment reconciliation endpoint:

`/api/cron/reconcile-payments`

This endpoint provides a recovery mechanism for successful Stripe payments that were not recorded through normal webhook processing.

The current branch still includes a legacy Vercel Cron configuration in `vercel.json`. This configuration does not schedule jobs on Cloudflare Workers.

Cloudflare-compatible scheduling and removal of the obsolete Vercel configuration are deferred to a separate follow-up change.

Production payment operations should not rely on automatic reconciliation until Cloudflare scheduling has been configured and tested.

### Why There Is No firebase-admin in `src/`

The Firestore client in `firebase-admin` generates code at runtime, which Cloudflare Workers block.

Server code therefore reaches Firestore and Firebase Auth through their REST APIs.

The REST client lives in `src/server/firebase/` and exposes the same methods the app used from `firebase-admin`.

Scripts in `scripts/` run in Node.js, so they still use `firebase-admin`.
