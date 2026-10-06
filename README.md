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
- Firebase emulator seed data
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

## Commands

| Command                            | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| `npm run dev`                      | Start only the Next.js development server        |
| `npm run dev:local`                | Start the complete local development environment |
| `npm run firebase:emulators:start` | Start Firebase emulators manually                |
| `npm run firebase:seed`            | Seed local Firebase emulator data                |
| `npm run build`                    | Create a production build                        |
| `npm run lint`                     | Run ESLint                                       |
| `npm run format`                   | Format with Prettier                             |
| `npm run format:check`             | Check formatting                                 |
| `npm test`                         | Run Jest tests                                   |
| `npm run test:e2e`                 | Run Playwright tests                             |

## Testing

Unit and component tests use **Jest + React Testing Library**.

End-to-end tests use **Playwright**.

Before opening a pull request, run:

```bash
npm run format:check
npm run lint
npm test
npm run test:e2e
npm run build
```

## CI

GitHub Actions runs formatting, linting, tests, and the production build on pull requests and pushes to `main`.
