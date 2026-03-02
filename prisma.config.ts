import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

console.log("DATABASE_URL from env:", env('DATABASE_URL')); // Debug log to check if DATABASE_URL is loaded

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'), // Use env() for type-safe access
  },
});