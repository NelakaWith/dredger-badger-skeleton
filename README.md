# Dredger Badger (Architectural Preview)

**A generic, production-ready AI-First Scraping & Intelligence Boilerplate.**

> [!NOTE]
> This repository is a **stripped-down architectural showcase**. It contains the complete folder structure, infrastructure configurations, and interface contracts to demonstrate the system's design, database relations, and scalability. The core algorithmic execution paths and private prompt templates have been stubbed to protect intellectual property.

## 🏗️ Architectural Overview

Dredger Badger is a robust, distributed headless backend system designed to take any target URL, orchestrate multi-tier data extraction, and leverage Large Language Models (LLMs) to structure unstructured content into predictable, schema-validated JSON.

### Technical Stack

- **Monorepo Architecture:** Monolithic code workspace managed via `pnpm` and `Turborepo`.
- **Primary Backend Core:** NestJS (TypeScript) v11+ implementing modular dependency injection.
- **Microservices Engine:** Python FastAPI microservice optimized for high-performance crawling.
- **Distributed Queuing:** `BullMQ` backed by `Redis` for isolated, rate-limited stage execution and fault-tolerant retry loops.
- **Persistence Layer:** PostgreSQL with `pgvector` extension for structured storage and semantic vector embeddings, managed via `Drizzle ORM`.
- **Inference Pipeline:** Dual-pass abstraction layer optimized for Groq (Llama 3/70B) for noise elimination, and Google Gemini for embedding generation.

## 🧬 Distributed System Workflow

The system cleanly decouples extraction from analytical intelligence by splitting the processing lifecycle into isolated, asynchronous queue stages:

1. **Ingestion Layer:** Accepts a unified payload, runs structural validation, deduplicates targets against historical hashes, creates an initial database record, and pushes a transaction to the ingestion queue.
2. **High-Signal Scraping (Stage 1 Queue):** A worker evaluates the optimal extraction tier. It pulls raw text/markdown, strips out DOM noise (scripts, headers, footers) via high-speed inference, updates the task state, and enqueues the analytical job.
3. **Intelligence Synthesis (Stage 2 Queue):** Evaluates user-defined schemas. Structures the sanitized payload, passes text blocks to semantic embedding engines, saves the resulting matrix array alongside JSON records, and flags the transaction as complete.

## 📂 Project Structure

```text
.
├── apps
│   ├── api           # NestJS Backend (Controllers, BullMQ Processors, & Drizzle Entities)
│   └── crawler       # Python FastAPI service (Crawl4AI extraction layer)
├── packages
│   ├── eslint-config # Shared linting configurations
│   ├── tsconfig      # Monorepo-wide strict TypeScript rule sets
│   └── ui            # Shared component interfaces (React/Tailwind)
├── docker-compose.yml # Production-ready infrastructure configurations (Postgres + Redis)
├── pnpm-workspace.yaml# pnpm multi-package workspace allocation
└── turbo.json        # Turborepo task execution graphs
```

## 📊 Core Data Modeling (Schema Overview)

The persistence layer is mapped out using type-safe Drizzle entities. The primary schema layout tracks async jobs through their lifecycle state changes:

```typescript
// Architectural representation of the primary Task Schema
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  processingStatus: text("processing_status")
    .$type<"discovered" | "scraped" | "analyzed" | "failed">()
    .default("discovered"),
  rawContent: text("raw_content"),
  structuredJson: jsonb("structured_json"),
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector destination
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

## 🔌 API Entrypoint Contract

### `POST /api/ingest`

Submits a data capture job to the ingestion queue infrastructure.

**Request Payload:**

```json
{
  "url": "[https://example.com/target-article](https://example.com/target-article)",
  "intensity": "double-pass",
  "schema": {
    "title": "string",
    "author": "string",
    "token_reduction": "string"
  }
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "taskId": "a9b8c7d6-e5f4-3c2b-1a0z-9y8x7w6v5u4t",
  "status": "discovered",
  "message": "Target URL successfully validated and pushed to Scrape Queue."
}
```

## 🚀 Getting Started (Simulation)

This workspace is fully configured to showcase infrastructure orchestration and dependencies.

### 1. Initialize Backing Infrastructure

Spin up the local PostgreSQL container (pre-loaded with the `pgvector` bundle) and the Redis queue engine instance:

```bash
docker-compose up -d

```

### 2. Install Workspace Dependencies

Execute a structural monorepo-wide module installation:

```bash
pnpm install

```

### 3. Synchronize Database Schemas

Push the local structural entity tables down into your running PostgreSQL docker node:

```bash
pnpm --filter api db:push

```

### 4. Run the Development Stack

Utilize Turborepo to concurrently handle hot-reloads across the NestJS API server and the underlying Python extraction daemon:

```bash
pnpm dev

```

_(Note: To simplify architectural evaluation without active cloud costs, the system includes an out-of-the-box `AI_PROVIDER="mock"` fallback inside the `.env.example` to allow local end-to-end testing without external API key quotas)._

---

**Interested in the complete production engine implementation?**
The full, unstripped commercial version includes:

- Highly optimized, production-tested prompt injection templates for noise scrubbing.
- Strict token-budget limiters and automatic back-off retry logic handlers inside BullMQ workers.
- Automated anti-bot block evasion, custom header rotational proxies, and stealth playwright browser configurations.
- Multi-tier production deployment manifests and GitLab Semantic Release automation pipelines.

_Full logic is delivered securely via a private repository invite instantly upon license purchase._

```

```
