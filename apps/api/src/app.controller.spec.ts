import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('AppController', () => {
  let appController: AppController;

  const mockDrizzleDb = {
    query: {
      tasks: {
        findMany: jest.fn(),
      },
    },
  };

  const mockScrapeQueue = {
    add: jest.fn(),
  };

  const mockAnalyzeQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: 'DRIZZLE_DB',
          useValue: mockDrizzleDb,
        },
        {
          provide: getQueueToken('scrape'),
          useValue: mockScrapeQueue,
        },
        {
          provide: getQueueToken('analyze'),
          useValue: mockAnalyzeQueue,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
