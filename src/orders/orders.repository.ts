import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, CreationAttributes, FindOptions } from 'sequelize';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './entities/order-status.enum';

@Injectable()
export class OrdersRepository {
    constructor(
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(OrderItem) private readonly itemModel: typeof OrderItem,
    ) { }

    findAll(options?: FindOptions) {
        return this.orderModel.findAll(options);
    }

    findActive() {
        return this.orderModel.findAll({
            where: { status: { [Op.ne]: OrderStatus.DELIVERED } },
            include: [OrderItem],
            order: [['orderId', 'ASC']],
        });
    }

    async createWithItems(payload: {
        clientName: string;
        items: Array<{ description: string; quantity: number; unitPrice: number }>;
    }) {
        return this.orderModel.sequelize!.transaction(async (t) => {
            const order = await this.orderModel.create(
                { clientName: payload.clientName } as CreationAttributes<Order>,
                { transaction: t },
            );

            const items: CreationAttributes<OrderItem>[] = payload.items.map(i => ({
                ...i,
                orderId: order.orderId,
            }));

            await this.itemModel.bulkCreate(items, { transaction: t });

            return this.orderModel.findByPk(order.orderId, {
                include: [OrderItem],
                transaction: t,
            });
        });
    }

    findById(orderId: number) {
        return this.orderModel.findByPk(orderId, { include: [OrderItem] });
    }

    async updateStatus(orderId: number, status: OrderStatus) {
        await this.orderModel.update({ status }, { where: { orderId: orderId } });
        return this.findById(orderId);
    }

    deleteById(orderId: number) {
        return this.orderModel.destroy({ where: { orderId: orderId } });
    }

    findByIdIncludingDeleted(orderId: number) {
        return this.orderModel.findOne({
            where: { orderId },
            paranoid: false,
            include: { all: true },
        });
    }

    async restore(orderId: number) {
        await this.orderModel.restore({ where: { orderId } });
    }

    async setStatus(orderId: number, status: OrderStatus) {
        await this.orderModel.update({ status }, { where: { orderId } });
        return this.orderModel.findOne({ where: { orderId } });
    }
}
