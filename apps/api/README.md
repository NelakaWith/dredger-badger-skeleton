# Dredger Badger API (Backend)

This is the main NestJS backend for the Dredger Badger project. It handles task queueing, database interactions (via Drizzle ORM), AI-driven analysis, and serves as the primary entry point for processing URLs.

## Project Setup

```bash
pnpm install
```

## Environment Variables

Make sure to set up your `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

## Running the app

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Database

```bash
# Push schema changes
pnpm run db:push

# Launch Drizzle Studio
pnpm run db:studio
```

## Test

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```
