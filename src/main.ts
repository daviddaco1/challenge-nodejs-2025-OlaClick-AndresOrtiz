import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Pipes globales
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global prefix for routes
  app.setGlobalPrefix('api');

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Orders API')
    .setDescription('Order management with items and statuses')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  await app.listen(configService.get<number>('NODE_PORT') ?? 3000);
}
bootstrap();
