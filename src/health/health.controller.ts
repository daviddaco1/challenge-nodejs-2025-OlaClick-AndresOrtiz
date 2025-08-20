// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';

class SequelizeHealthIndicator extends HealthIndicator {
  constructor(private readonly sequelize: Sequelize) { super(); }
  async isHealthy(key = 'postgres'): Promise<HealthIndicatorResult> {
    try {
      await this.sequelize.authenticate();
      return this.getStatus(key, true);
    } catch (e: any) {
      throw new HealthCheckError(
        'Postgres check failed',
        this.getStatus(key, false, { message: e?.message }),
      );
    }
  }
}

class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: Redis) { super(); }
  async isHealthy(key = 'redis'): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      const ok = pong === 'PONG';
      if (!ok) throw new Error(`Unexpected PING result: ${pong}`);
      return this.getStatus(key, true, { pong });
    } catch (e: any) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message: e?.message }),
      );
    }
  }
}

@Controller()
export class HealthController {
  private readonly dbIndicator: SequelizeHealthIndicator;
  private readonly redisIndicator: RedisHealthIndicator;

  constructor(
    private readonly health: HealthCheckService,
    @InjectConnection() sequelize: Sequelize,
    @InjectRedis() redis: Redis,
  ) {
    this.dbIndicator = new SequelizeHealthIndicator(sequelize);
    this.redisIndicator = new RedisHealthIndicator(redis);
  }

  @Get('/health')
  @HealthCheck()
  async liveness() {
    return this.health.check([
      async () => ({ api: { status: 'up' } }),
    ]);
  }

  @Get('/ready')
  @HealthCheck()
  async readiness() {
    return this.health.check([
      async () => this.dbIndicator.isHealthy('postgres'),
      async () => this.redisIndicator.isHealthy('redis'),
    ]);
  }
}