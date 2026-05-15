import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: 'DRIZZLE_DB',
          useValue: {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue([]),
            insert: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'test-id' }]),
          },
        },
        {
          provide: getQueueToken('scrape'),
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'job-id' }),
          },
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
