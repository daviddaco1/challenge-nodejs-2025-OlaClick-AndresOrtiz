import {
  Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement, Default, DeletedAt
} from 'sequelize-typescript';
import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';

import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';

@Table({
  tableName: 'orders', paranoid: true,
  timestamps: true,
})
export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare orderId: CreationOptional<number>;

  @Column({ type: DataType.STRING, allowNull: false })
  declare clientName: string;

  @Default(OrderStatus.INITIATED)
  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    allowNull: false,
  })
  declare status: CreationOptional<OrderStatus>;

  @HasMany(() => OrderItem, { onDelete: 'CASCADE', hooks: true })
  declare items?: NonAttribute<OrderItem[]>;

  @DeletedAt
  @Column(DataType.DATE)
  declare deletedAt: Date | null;
}