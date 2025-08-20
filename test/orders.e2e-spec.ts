import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { OrderStatus } from '../src/orders/entities/order-status.enum';

describe('OrdersController (e2e, mocked service)', () => {
  let app: INestApplication;

  // Service mockup
  const serviceMock = {
    listActive: jest.fn().mockResolvedValue([
      { orderId: 1, clientName: 'Ana', status: OrderStatus.INITIATED, items: [] },
    ]),
    create: jest.fn(),
    findOne: jest.fn(),
    advance: jest.fn(),
    restore: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: serviceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /orders → 200 and array', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ orderId: 1, status: OrderStatus.INITIATED });
    expect(serviceMock.listActive).toHaveBeenCalled();
  });

  it('POST /orders → 201 when valid body', async () => {
    const payload = {
      clientName: 'Ana López',
      items: [{ description: 'Ceviche', quantity: 2, unitPrice: 50 }],
    };
    serviceMock.create.mockResolvedValueOnce({
      orderId: 10,
      ...payload,
      status: OrderStatus.INITIATED,
    });

    const res = await request(app.getHttpServer())
      .post('/orders')
      .send(payload)
      .expect(201);

    expect(serviceMock.create).toHaveBeenCalledWith(payload);
    expect(res.body).toHaveProperty('orderId', 10);
  });

  it('POST /orders → 400 when items []', async () => {
    const bad = { clientName: 'Ana', items: [] };
    await request(app.getHttpServer())
      .post('/orders')
      .send(bad)
      .expect(400);
  });

  it('GET /orders/:orderId → 200 when exists', async () => {
    serviceMock.findOne.mockResolvedValueOnce({
      orderId: 2,
      clientName: 'Juan',
      status: OrderStatus.SENT,
      items: [],
    });

    const res = await request(app.getHttpServer())
      .get('/orders/2')
      .expect(200);

    expect(serviceMock.findOne).toHaveBeenCalledWith(2);
    expect(res.body).toMatchObject({ orderId: 2, status: OrderStatus.SENT });
  });

  it('POST /orders/:orderId/advance → 200', async () => {
    serviceMock.advance.mockResolvedValueOnce({
      orderId: 3,
      status: OrderStatus.SENT,
    });

    const res = await request(app.getHttpServer())
      .post('/orders/3/advance')
      .expect(200);

    expect(serviceMock.advance).toHaveBeenCalledWith(3);
    expect(res.body).toMatchObject({ orderId: 3, status: OrderStatus.SENT });
  });

  it('POST /orders/:orderId/restore → 200', async () => {
    serviceMock.restore.mockResolvedValueOnce({
      orderId: 4,
      status: OrderStatus.INITIATED,
    });

    const res = await request(app.getHttpServer())
      .post('/orders/4/restore')
      .expect(200);

    expect(serviceMock.restore).toHaveBeenCalledWith(4);
    expect(res.body).toMatchObject({ orderId: 4, status: OrderStatus.INITIATED });
  });
});
