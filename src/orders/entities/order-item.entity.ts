import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo,
  PrimaryKey, AutoIncrement,
} from 'sequelize-typescript';
import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { Order } from './order.entity';

@Table({ tableName: 'order_items', timestamps: true })
export class OrderItem extends Model<
  InferAttributes<OrderItem>,
  InferCreationAttributes<OrderItem>
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare itemId: CreationOptional<number>;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare orderId: number;

  @BelongsTo(() => Order)
  declare order: NonAttribute<Order>;

  @Column({ type: DataType.STRING, allowNull: false })
  declare description: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare unitPrice: number;
}
