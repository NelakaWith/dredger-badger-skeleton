import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  async ingest(@Body('url') url: string, @Body('title') title?: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }
    
    try {
      new URL(url); // validate URL format
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    return this.ingestionService.ingestUrl(url, title);
  }
}
