import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order-status.enum';

const ORDERS_CACHE_KEY = 'orders:active';
const TTL_SECONDS = 30;

@Injectable()
export class OrdersService {
    constructor(
        private readonly repo: OrdersRepository,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    async listActive() {
        const cached = await this.redis.get(ORDERS_CACHE_KEY);
        if (cached) return JSON.parse(cached);

        const data = await this.repo.findActive();
        await this.redis.set(ORDERS_CACHE_KEY, JSON.stringify(data), 'EX', TTL_SECONDS);
        return data;
    }

    async create(dto: CreateOrderDto) {
        const order = await this.repo.createWithItems(dto);
        await this.redis.del(ORDERS_CACHE_KEY);
        return order;
    }

    async findOne(orderId: number) {
        const order = await this.repo.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async advance(orderId: number) {
        const order = await this.repo.findById(orderId);
        if (!order) throw new NotFoundException('Order not found');

        let next: OrderStatus | null = null;
        switch (order.status) {
            case OrderStatus.INITIATED: next = OrderStatus.SENT; break;
            case OrderStatus.SENT: next = OrderStatus.DELIVERED; break;
            case OrderStatus.DELIVERED: next = null; break;
        }

        if (next === OrderStatus.DELIVERED) {
            await order.update({ status: OrderStatus.DELIVERED });
            await order.destroy();
            await this.redis.del(ORDERS_CACHE_KEY);
            return { softDeleted: true, previousStatus: OrderStatus.SENT, currentStatus: OrderStatus.DELIVERED };
        }

        if (!next) {
            await order.destroy();
            await this.redis.del(ORDERS_CACHE_KEY);
            return { softDeleted: true, currentStatus: OrderStatus.DELIVERED };
        }

        const updated = await order.update({ status: next });
        await this.redis.del(ORDERS_CACHE_KEY);
        return updated;
    }

    async restore(orderId: number) {
        const order = await this.repo.findByIdIncludingDeleted(orderId);
        if (!order) throw new NotFoundException('Order not found');

        if (!order.deletedAt) {
            throw new BadRequestException('Order is not deleted');
        }

        await this.repo.restore(orderId);
        const restored = await this.repo.setStatus(orderId, OrderStatus.INITIATED);

        await this.redis.del(ORDERS_CACHE_KEY);

        return restored;
    }
}
