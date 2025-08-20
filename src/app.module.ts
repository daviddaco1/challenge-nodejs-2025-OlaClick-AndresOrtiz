import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

import { OrdersModule } from './orders/orders.module';

function getEnvFile(): string {
  const envPath = path.resolve(process.cwd(), '.env');
  const localEnvPath = path.resolve(process.cwd(), 'local.env');

  if (fs.existsSync(envPath)) {
    return envPath;
  } else if (fs.existsSync(localEnvPath)) {
    return localEnvPath;
  } else {
    console.warn('⚠️ No .env or local.env file found');
    return '';
  }
}

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFile(),
    }),

    // PostgreSQL + Sequelize
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadModels: true,
        synchronize: true,
        logging: false,
      }),
    }),

    // Redis
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: `redis://${config.get<string>('REDIS_HOST')}:${config.get<string>('REDIS_PORT')}`,
      }),
    }),

    // Schedule
    ScheduleModule.forRoot(),

    // Orders Module
    OrdersModule,
  ],
})
export class AppModule { }