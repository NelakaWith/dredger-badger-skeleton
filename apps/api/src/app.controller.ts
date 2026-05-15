import { Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('recover')
  async triggerRecovery() {
    const result = await this.appService.recoverStuckTasks();
    return { status: 'Recovery cycle triggered', detail: result };
  }

  @Get('status')
  getStatus() {
    return this.appService.getPipelineStatus();
  }

  @Post('backfill')
  async triggerBackfill() {
    const result = await this.appService.backfillMissingData();
    return { status: 'Backfill process triggered', detail: result };
  }

  @Get('tasks')
  async getTasks(@Query('status') status?: string) {
    return this.appService.getTasks(status);
  }

  @Get('tasks/clusters')
  async getClusters() {
    return this.appService.getClusters();
  }

  @Get('tasks/bias-ticker')
  async getBiasTicker() {
    return this.appService.getBiasTicker();
  }
}
