import {prisma} from '../prisma/prismaClient';

export async function getProcessedSessionsFromDb(): Promise<string[]> {
  const sessions = await prisma.processed_session.findMany({ select: { session_id: true } });
  return sessions.map(s => s.session_id);
}

export async function markSessionProcessedInDb(sessionId: string): Promise<void> {
  await prisma.processed_session.upsert({
    where: { session_id: sessionId },
    update: {},
    create: { session_id: sessionId },
  });
}
