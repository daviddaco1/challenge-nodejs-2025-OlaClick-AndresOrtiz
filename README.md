# 🍽️ OlaClick Backend Challenge – NestJS Edition

This project is a backend service for managing restaurant orders, built with **NestJS**, **PostgreSQL**, **Sequelize**, and **Redis**.  
It includes unit and e2e tests, Swagger documentation, soft delete and restore functionality for orders, and scheduled jobs to clean up old orders.

## 🛠️ Tech Stack

- **Node.js** + **TypeScript**
- **NestJS**
- **Sequelize ORM** (with paranoid soft deletes)
- **PostgreSQL**
- **Redis** (caching)
- **Docker & docker-compose** (includes PgAdmin and Redis Commander)
- **Jest** (unit & e2e)
- **@nestjs/schedule** (scheduled jobs)

## 📂 Project Structure
```
src/
 ├── orders/
 │   ├── dto/                      # Data Transfer Objects (validations)
 │   ├── entities/                 # Sequelize models
 │   ├── orders.controller.ts
 │   ├── orders.service.ts
 │   ├── orders.repository.ts
 │   ├── orders-cleanup.service.ts # Scheduled job for old orders cleanup
 │   ├── orders.module.ts
 ├── app.module.ts
 ├── main.ts
test/
 ├── orders-cleanup.service.e2e-spec.ts
 ├── orders.e2e-spec.ts
 ├── jest-e2e.json
```

## 🚀 Features

### Orders
- **GET /orders** → Lists active (non-delivered) orders from Redis cache (30s).
- **POST /orders** → Creates a new order with items (`status = initiated`).
- **GET /orders/:id** → Returns full order details with items.
- **POST /orders/:id/advance** → Advances the order status:  
  `initiated → sent → delivered`  
  Once delivered → performs soft delete and removes from cache.
- **POST /orders/:id/restore** → Restores a soft-deleted order and sets status back to initiated.

### Maintenance
- **Scheduled Jobs** → Automatically deletes soft-deleted orders older than a configurable number of days.

## 🐳 Running with Docker
```bash
docker-compose up --build
```

This will start:
- **app** → NestJS backend
- **db** → PostgreSQL
- **redis** → Redis
- **pgadmin** → PostgreSQL GUI
- **redis-commander** → Redis GUI

## 🧪 Testing

Run all tests (unit + e2e):
```bash
npm run test
```

Run with detailed output:
```bash
npm run test:watch
```

## 📘 API Documentation

The API documentation is available at:
- **Swagger** → [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- Postman / cURL
