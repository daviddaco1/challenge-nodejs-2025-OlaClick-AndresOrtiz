import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) { }

  @Get()
  @ApiOperation({ summary: 'List active orders' })
  @ApiResponse({ status: 200, description: 'List of active orders' })
  list() {
    return this.service.listActive();
  }

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getById(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.findOne(orderId);
  }

  @Post(':orderId/advance')
  @HttpCode(200)
  @ApiOperation({ summary: 'Advance the status of an order' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  advance(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.advance(orderId);
  }

  @Post(':orderId/restore')
  @HttpCode(200)
  @ApiOperation({ summary: 'Restore a soft-deleted order and set status to initiated' })
  @ApiResponse({ status: 200, description: 'Order restored' })
  @ApiResponse({ status: 400, description: 'Order is not deleted' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  restore(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.restore(orderId);
  }
}
