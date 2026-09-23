<div align="center">

# Milestones & Meaning

A website for **Milestones & Meaning**, a life-transition and relationship support practice.

</div>

---

## Overview

This repository contains the Milestones & Meaning web application.

The project is built with **Next.js** and uses a small, consistent development toolchain for formatting, testing, and continuous integration.

## Tech Stack

| Area                   | Technology                   |
| ---------------------- | ---------------------------- |
| Framework              | Next.js                      |
| Language               | JavaScript                   |
| UI                     | React                        |
| Styling                | Tailwind CSS                 |
| Linting                | ESLint                       |
| Formatting             | Prettier                     |
| Unit Testing           | Jest + React Testing Library |
| End-to-End Testing     | Playwright                   |
| Continuous Integration | GitHub Actions               |
| Dependency Updates     | Dependabot                   |

---

## Requirements

Before running the project, make sure you have:

- **Node.js 24**
- **npm**

The expected Node version is also defined in:

```text
.node-version
```

---

## Getting Started

### 1. Install dependencies

```bash
npm ci
```

### 2. Start the development server

```bash
npm run dev
```

### 3. Open the application

```text
http://localhost:3000
```

---

## Available Commands

| Command                 | Description                             |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start the development server            |
| `npm run build`         | Create a production build               |
| `npm run start`         | Start the production server             |
| `npm run lint`          | Run ESLint                              |
| `npm run format`        | Format the project with Prettier        |
| `npm run format:check`  | Check formatting without changing files |
| `npm test`              | Run Jest tests                          |
| `npm run test:watch`    | Run Jest in watch mode                  |
| `npm run test:coverage` | Run Jest with coverage                  |
| `npm run test:e2e`      | Run Playwright end-to-end tests         |
| `npm run test:e2e:ui`   | Open the Playwright test UI             |

---

## Testing

### Unit and Component Tests

Unit and component tests use:

- Jest
- React Testing Library

Tests are stored in:

```text
src/__tests__/
```

Run them with:

```bash
npm test
```

### End-to-End Tests

End-to-end tests use **Playwright**.

Tests are stored in:

```text
e2e/
```

Run them with:

```bash
npm run test:e2e
```

### Browser Coverage

Local Playwright tests run against:

- Chromium
- Firefox

GitHub Actions also runs:

- WebKit

This gives the project additional Safari-like browser coverage in CI.

---

## Code Quality

The project uses **ESLint** for code-quality checks and **Prettier** for consistent formatting.

Tailwind CSS classes are automatically ordered using:

```text
prettier-plugin-tailwindcss
```

Before opening a pull request, run:

```bash
npm run format:check
npm run lint
npm test
npm run test:e2e
npm run build
npm audit
```

---

## Continuous Integration

GitHub Actions runs automatically on:

- Pull requests targeting `main`
- Pushes to `main`

The CI workflow checks:

1. Formatting
2. ESLint
3. Jest tests
4. Playwright tests
5. Production build

A successful CI run helps ensure changes are ready to be merged.

---

## Dependency Updates

Dependabot checks for updates to:

- npm dependencies
- GitHub Actions

Dependency checks run weekly.

---

## Development Workflow

Development should normally happen on a dedicated branch instead of directly on `main`.

Create a branch:

```bash
git switch -c feat/example-feature
```

When the work is ready:

1. Commit the changes.
2. Push the branch.
3. Open a pull request into `main`.
4. Wait for CI checks to pass.
5. Review and merge the pull request.

---

## Project Structure

```text
.
├── e2e/                  # Playwright end-to-end tests
├── public/               # Static assets
├── src/
│   ├── __tests__/        # Jest tests
│   └── app/              # Next.js App Router
├── .github/
│   ├── workflows/        # GitHub Actions
│   └── dependabot.yml    # Dependency update configuration
├── eslint.config.mjs
├── jest.config.mjs
├── playwright.config.js
├── .prettierrc
└── package.json
```

> The project structure will grow as application features are added.
