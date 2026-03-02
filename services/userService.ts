import { prisma } from '../prisma/prismaClient';
import {User} from '../types';

function toUser(u: any): User {
  return {
    ...u,
    created_at: u.created_at instanceof Date ? u.created_at.toISOString() : u.created_at,
  };
}
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? toUser(user) : null;
}

export async function upsertUser(user: User): Promise<User | null> {
  // Omit relational fields before upsert
  const { payment_history, generation_stat, ...userData } = user as any;
  console.log("Upserting user with email:", user.email, "Data:", userData);
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    const updated = await prisma.user.update({ where: { email: user.email }, data: userData });
    return toUser(updated);
  } else {
    const created = await prisma.user.create({ data: userData });
    return toUser(created);
  }
}

export async function updateUserByEmail(email: string, updates: Partial<User>): Promise<User | null> {
  // Omit relational fields before update
  const { payment_history, generation_stat, ...updateData } = updates as any;
  console.log("Updating user with email:", email, "Updates:", updateData);
  const updated = await prisma.user.update({ where: { email }, data: updateData });
  return toUser(updated);
}