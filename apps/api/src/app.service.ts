import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './db/schema';
import { sql, and, lt, desc, eq, isNull, or } from 'drizzle-orm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Task } from './db/schema';

export interface ClusterResult {
  id: string;
  target: string | null;
  title: string;
  tasks: Task[];
  representativeSentiment: number | null;
}

interface TaskResults {
  target?: string | null;
  sentimentScore?: number | null;
  chargedAdjectives?: string[];
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('DRIZZLE_DB') private readonly db: NeonHttpDatabase<typeof schema>,
    @InjectQueue('scrape') private readonly scrapeQueue: Queue,
    @InjectQueue('analyze') private readonly analyzeQueue: Queue,
  ) {}

  async onModuleInit() {
    // Check crawler health on app startup
    await this.checkCrawlerHealth();
  }

  private async checkCrawlerHealth(): Promise<void> {
    const crawlerUrl = process.env.CRAWLER_URL || 'http://127.0.0.1:3001';

    try {
      const response = await fetch(`${crawlerUrl}/health`);

      if (response.ok) {
        const data = (await response.json()) as {
          status: string;
          service: string;
        };
        this.logger.log(
          `✅ Crawler service is healthy (${crawlerUrl}): ${JSON.stringify(data)}`,
        );
      } else {
        this.logger.warn(
          `⚠️ Crawler service returned status ${response.status} (${crawlerUrl})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `🛑 Failed to connect to Crawler service at ${crawlerUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async recoverStuckTasks() {
    this.logger.log('🕵️ Checking for stuck tasks...');

    // 1. Find tasks stuck in 'discovered' or 'scraped' for > 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stuckTasks = await this.db
      .select()
      .from(schema.tasks)
      .where(
        and(
          sql`${schema.tasks.processingStatus} IN ('discovered', 'scraped')`,
          lt(schema.tasks.updatedAt, tenMinutesAgo),
        ),
      );

    if (stuckTasks.length === 0) {
      this.logger.log('✅ No stuck tasks found.');
      return { recovered: 0 };
    }

    this.logger.warn(
      `🔄 Found ${stuckTasks.length} stuck tasks. Recovering...`,
    );

    for (const task of stuckTasks) {
      if (task.processingStatus === 'discovered') {
        await this.scrapeQueue.add('scrape', {
          link: task.url,
          title: task.title,
        });
      }
    }

    return { recovered: stuckTasks.length };
  }

  async getPipelineStatus() {
    const counts = await this.db
      .select({
        status: schema.tasks.processingStatus,
        count: sql<number>`count(*)`,
      })
      .from(schema.tasks)
      .groupBy(schema.tasks.processingStatus);

    const result = counts.reduce(
      (acc, curr) => {
        acc[curr.status || 'unknown'] = Number(curr.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    const isIdle =
      (result['discovered'] || 0) === 0 && (result['scraped'] || 0) === 0;

    return {
      stats: result,
      isIdle,
      message: isIdle
        ? '🏁 All pipelines completed. All found tasks have been processed.'
        : '🏃‍➡️ Pipeline is still active. There are tasks waiting to be scraped or analyzed.',
    };
  }

  async getTasks(status?: string) {
    const query = this.db
      .select()
      .from(schema.tasks)
      .limit(50)
      .orderBy(desc(schema.tasks.createdAt));

    if (status) {
      query.where(eq(schema.tasks.processingStatus, status));
    }

    return query;
  }

  /**
   * Re-enqueues tasks that are missing critical analysis data (backfill).
   */
  async backfillMissingData() {
    this.logger.log('🧹 Checking for tasks with missing analysis data...');

    // Find analyzed tasks that are missing embeddings or results
    const incompleteTasks = await this.db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.processingStatus, 'analyzed'),
          or(isNull(schema.tasks.embedding), isNull(schema.tasks.results)),
        ),
      );

    if (incompleteTasks.length === 0) {
      this.logger.log('✅ No incomplete tasks found.');
      return { backfilled: 0 };
    }

    this.logger.warn(
      `🔄 Found ${incompleteTasks.length} incomplete tasks. Re-enqueuing for analysis...`,
    );

    for (const task of incompleteTasks) {
      await this.analyzeQueue.add(
        'analyze',
        { taskId: task.id },
        { jobId: `backfill-${task.id}`, removeOnComplete: true },
      );

      // Reset status to allow re-analysis if needed, though Processor handles it
      await this.db
        .update(schema.tasks)
        .set({
          processingStatus: 'scraped',
          updatedAt: new Date(),
        })
        .where(eq(schema.tasks.id, task.id));
    }

    return { backfilled: incompleteTasks.length };
  }

  /**
   * Groups tasks into clusters based on embedding similarity (The Information Delta).
   */
  async getClusters(): Promise<ClusterResult[]> {
    // 1. Fetch analyzed tasks from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tasksList = await this.db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.processingStatus, 'analyzed'),
          sql`${schema.tasks.updatedAt} > ${yesterday}`,
        ),
      )
      .orderBy(desc(schema.tasks.createdAt));

    if (tasksList.length === 0) return [];

    const clusters: ClusterResult[] = [];
    const processedIds = new Set<string>();

    for (const task of tasksList) {
      if (processedIds.has(task.id)) continue;

      // Start a new cluster
      const clusterTasks = [task];
      processedIds.add(task.id);

      // Find similar tasks
      for (const other of tasksList) {
        if (processedIds.has(other.id)) continue;

        const similarity = this.calculateCosineSimilarity(
          task.embedding as number[] | string | null,
          other.embedding as number[] | string | null,
        );

        if (similarity > 0.85) {
          clusterTasks.push(other);
          processedIds.add(other.id);
        }
      }

      const results = task.results as TaskResults;
      clusters.push({
        id: task.id,
        target: results?.target || null,
        title: task.title,
        tasks: clusterTasks,
        representativeSentiment: results?.sentimentScore || null,
      });
    }

    return clusters;
  }

  /**
   * Fetches the "Bias Ticker" data — most sensationalized headlines.
   */
  async getBiasTicker() {
    const tasksList = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.processingStatus, 'analyzed'))
      .limit(10)
      .orderBy(desc(schema.tasks.updatedAt));

    return tasksList
      .map((t) => {
        const results = t.results as TaskResults;
        const adjectives = Array.isArray(results?.chargedAdjectives)
          ? results.chargedAdjectives
          : [];
        return {
          id: t.id,
          title: t.title,
          adjectiveCount: adjectives.length,
          adjectives,
          sentiment: results?.sentimentScore || null,
        };
      })
      .sort((a, b) => b.adjectiveCount - a.adjectiveCount);
  }

  private calculateCosineSimilarity(
    vecA: number[] | string | null,
    vecB: number[] | string | null,
  ): number {
    if (!vecA || !vecB) return 0;
    const a = (typeof vecA === 'string' ? JSON.parse(vecA) : vecA) as number[];
    const b = (typeof vecB === 'string' ? JSON.parse(vecB) : vecB) as number[];

    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}
