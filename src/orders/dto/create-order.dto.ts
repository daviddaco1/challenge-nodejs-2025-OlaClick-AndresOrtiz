import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, ValidateNested, IsNumber, ArrayNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'Pizza' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1, { message: 'The quantity must be at least 1' })
  quantity: number;

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  @Min(0.01, { message: 'The unit price must be greater than 0' })
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Jhon Doe' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayNotEmpty({ message: 'The list of items cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}