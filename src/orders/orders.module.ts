import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersCleanupService } from './orders-cleanup.service';

@Module({
  imports: [SequelizeModule.forFeature([Order, OrderItem])],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrdersCleanupService],
})
export class OrdersModule {}