import { PrismaClient } from '@prisma/client';
import z from 'zod';

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

// We deliberately reuse a single PrismaClient (and therefore a single
// connection pool) across the whole process. This module is bundled twice —
// once into the Remix server build and once into `server.ts` (Socket.IO) — so
// without the `global.__db__` guard we'd end up with *two* pools competing for
// the same database. When each pool defaults to only `num_cpus * 2 + 1`
// connections (3 on the single-CPU host), loaders could exhaust their pool and
// time out (P2024) while the Socket.IO pool sat idle. Sharing one pool fixes
// that in production, and also keeps development from opening a new connection
// on every hot reload.
if (!global.__db__) {
  global.__db__ = getClient();
}
prisma = global.__db__;

function getClient() {
  const DATABASE_URL = z.string().parse(process.env.DATABASE_URL);

  const databaseUrl = new URL(DATABASE_URL);

  // Size the pool explicitly instead of relying on Prisma's CPU-based default
  // (`num_cpus * 2 + 1`), which is just 3 on the single-CPU host and is what
  // caused connection-pool timeouts under load. Both values stay overridable
  // via the connection string itself or the env vars below so they can be
  // tuned without a code change.
  if (!databaseUrl.searchParams.has('connection_limit')) {
    databaseUrl.searchParams.set(
      'connection_limit',
      process.env.DATABASE_CONNECTION_LIMIT ?? '10'
    );
  }
  if (!databaseUrl.searchParams.has('pool_timeout')) {
    databaseUrl.searchParams.set(
      'pool_timeout',
      process.env.DATABASE_POOL_TIMEOUT ?? '20'
    );
  }

  console.log(`🔌 setting up prisma client to ${databaseUrl.host}`);
  // NOTE: during development if you change anything in this function, remember
  // that this only runs once per server restart and won't automatically be
  // re-run per request like everything else is. So if you need to change
  // something in this file, you'll need to manually restart the server.
  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl.toString(),
      },
    },
  });
  // connect eagerly
  client.$connect();

  return client;
}

export { prisma };
