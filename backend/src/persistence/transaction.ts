import { Prisma } from '@prisma/client';
import { prisma } from './client.js';

export class SerializationConflict extends Error {
  constructor() {
    super('Transaction could not be serialized after repeated attempts.');
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isConflict = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';

/**
 * Postgres aborts one of two conflicting serializable transactions (P2034).
 * That is normal, not a failure: on retry the loser re-reads the committed
 * state and either succeeds or fails with a real rule violation. Backoff is
 * jittered so a burst does not collide again in lockstep.
 */
export async function runSerializable<T>(
  body: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts = 5,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(body, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      if (!isConflict(err)) throw err;
      if (attempt >= attempts) throw new SerializationConflict();
      await sleep(Math.round(2 ** attempt * (5 + Math.random() * 10)));
    }
  }
}
