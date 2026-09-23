# Milestones & Meaning

Website for **Milestones & Meaning**, a life-transition and relationship support practice.

## Requirements

- Node.js 24
- npm

## Setup

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Commands

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start the development server |
| `npm run build`        | Create a production build    |
| `npm run lint`         | Run ESLint                   |
| `npm run format`       | Format with Prettier         |
| `npm run format:check` | Check formatting             |
| `npm test`             | Run Jest tests               |
| `npm run test:e2e`     | Run Playwright tests         |

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
