# Dredger Badger (Architectural Preview)

**A generic, production-ready AI-First Scraping & Intelligence Boilerplate.**

> [!NOTE]
> This repository is a **stripped-down architectural showcase**. It contains the complete folder structure, infrastructure configurations, and interface contracts to demonstrate the system's design and scalability. The core algorithmic logic and private prompt templates have been stubbed to protect intellectual property.

## 🏗️ Architectural Overview

Dredger Badger is a robust, distributed headless backend designed to take any URL, perform complex extraction, and use Large Language Models (LLMs) to structure unstructured content into predictable JSON.

### Technical Stack
- **Monorepo:** Managed via `pnpm` and `Turborepo`.
- **Backend:** NestJS (TypeScript) v11+.
- **Microservices:** Python FastAPI microservice for high-performance scraping.
- **Queuing:** `BullMQ` backed by `Redis` for distributed job processing and rate limiting.
- **Database:** PostgreSQL with `pgvector` and `Drizzle ORM`.
- **AI Intelligence:** Optimized for Groq (Llama 3/70B) and Google Gemini (Embeddings).

## 📂 Project Structure

```text
.
├── apps
│   ├── api           # NestJS Backend (Workers & API Controllers)
│   └── crawler       # Python FastAPI service (Crawl4AI powered)
├── packages
│   ├── eslint-config # Shared linting rules
│   ├── tsconfig      # Shared TypeScript configurations
│   └── ui            # Shared UI components (React/Tailwind)
├── docker-compose.yml # Production-ready infrastructure (Postgres + Redis)
├── pnpm-workspace.yaml
└── turbo.json
```

## 🚀 Getting Started (Simulation)

This preview is configured to show how the system is deployed and managed.

### 1. Initialize Infrastructure
The system requires PostgreSQL (with `pgvector`) and Redis. A production-ready `docker-compose.yml` is included:

```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Database Schema
Schema management is handled via Drizzle ORM. You can push the schema to the local Postgres instance:

```bash
pnpm --filter api db:push
```

### 4. Run Development Stack
Turborepo orchestrates the parallel execution of the API and the Crawler microservice:

```bash
pnpm dev
```

## 🧬 Tiered Extraction Strategy

Web scraping is fragile. The system employs a "defense in depth" strategy:

1. **Tier 1 (Fast & Local):** Standard HTTP fetching with local DOM parsing.
2. **Tier 2 (Cloud Native):** Python-based `crawl4ai` for JS-heavy applications.
3. **Tier 3 (Agentic):** `@browserbasehq/stagehand` for complex sites requiring LLM-driven browser navigation.

---

**Interested in the full implementation?**
The complete, unstripped codebase includes:
- Highly refined, system-level prompt injection templates.
- Multi-tier structured inference loops with native rate-limiting.
- Automated anti-bot bypass and captcha handling logic.
- Production-grade deployment CI/CD pipelines.

*Full logic is delivered securely via private repo invite upon purchase.*
