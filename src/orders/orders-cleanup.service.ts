import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersRepository } from './orders.repository';
import { Op } from 'sequelize';
import { OrderStatus } from './entities/order-status.enum';

@Injectable()
export class OrdersCleanupService {
  private readonly logger = new Logger(OrdersCleanupService.name);

  constructor(private readonly repo: OrdersRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOldOrdersCleanup() {
    this.logger.log('Starting to clean up old orders…');

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    const oldOrders = await this.repo.findAll({
      where: {
        updatedAt: { [Op.lt]: threshold },
        status: { [Op.ne]: OrderStatus.DELIVERED },
      },
    });

    for (const order of oldOrders) {
      await order.update({ status: OrderStatus.DELIVERED });
      await order.destroy(); 
    }

    this.logger.log(`Orders cleared: ${oldOrders.length}`);
  }
}
