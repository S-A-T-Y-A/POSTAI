import { PrismaClient } from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import { connect } from "http2";

export const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({
    adapter,
});

