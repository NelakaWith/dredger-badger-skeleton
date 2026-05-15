import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Inject } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject('DRIZZLE_DB') private readonly db: NeonHttpDatabase<typeof schema>,
    @InjectQueue('scrape') private readonly scrapeQueue: Queue,
  ) {}

  async ingestUrl(url: string, title?: string) {
    try {
      this.logger.log(`📥 Ingesting URL: ${url}`);
      
      const existing = await this.db.select().from(schema.tasks).where(eq(schema.tasks.url, url));
      if (existing.length > 0) {
        this.logger.log(`⚠️ URL already exists in database: ${url}`);
        return { success: true, message: 'URL already tracked', taskId: existing[0].id };
      }

      const generatedTitle = title || `Task: ${new URL(url).hostname}`;

      const inserted = await this.db.insert(schema.tasks).values({
        url,
        title: generatedTitle,
        processingStatus: 'discovered',
      }).returning({ id: schema.tasks.id });

      const taskId = inserted[0].id;

      await this.scrapeQueue.add('scrape', {
        link: url,
        title: generatedTitle,
      });

      this.logger.log(`✅ Queued scrape job for ${url} (Task ID: ${taskId})`);
      return { success: true, taskId };
    } catch (error) {
      this.logger.error(`Failed to ingest URL ${url}: ${error.message}`);
      throw error;
    }
  }
}
