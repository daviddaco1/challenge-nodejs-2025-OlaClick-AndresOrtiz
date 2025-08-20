import { Test } from '@nestjs/testing';
import { OrdersCleanupService } from '../src/orders/orders-cleanup.service';
import { OrdersRepository } from '../src/orders/orders.repository';
import { OrderStatus } from '../src/orders/entities/order-status.enum';

function makeOrderMock({ updatedAt, status }: { updatedAt: Date; status: OrderStatus }) {
  return {
    updatedAt,
    status,
    update: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  };
}

describe('OrdersCleanupService', () => {
  let service: OrdersCleanupService;

  const repoMock = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const now = new Date();
    jest.useFakeTimers().setSystemTime(now);
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersCleanupService,
        { provide: OrdersRepository, useValue: repoMock },
      ],
    }).compile();

    service = moduleRef.get(OrdersCleanupService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Marks old undelivered orders as DELIVERED and soft-deleted', async () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const oldInitiated = makeOrderMock({ updatedAt: oldDate, status: OrderStatus.INITIATED });
    const oldSent = makeOrderMock({ updatedAt: oldDate, status: OrderStatus.SENT });
    const recentInitiated = makeOrderMock({ updatedAt: recentDate, status: OrderStatus.INITIATED });

    repoMock.findAll.mockResolvedValue([oldInitiated, oldSent]);

    await service.handleOldOrdersCleanup();

    expect(oldInitiated.update).toHaveBeenCalledWith({ status: OrderStatus.DELIVERED });
    expect(oldInitiated.destroy).toHaveBeenCalled();

    expect(oldSent.update).toHaveBeenCalledWith({ status: OrderStatus.DELIVERED });
    expect(oldSent.destroy).toHaveBeenCalled();

    expect(recentInitiated.update).not.toHaveBeenCalled();
    expect(recentInitiated.destroy).not.toHaveBeenCalled();

    expect(repoMock.findAll).toHaveBeenCalledTimes(1);
    const callArg = repoMock.findAll.mock.calls[0][0];
    expect(callArg).toMatchObject({
      where: expect.objectContaining({
        updatedAt: expect.any(Object),
        status: expect.any(Object),
      }),
    });
  });
});
