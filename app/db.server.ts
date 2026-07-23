import { PrismaClient } from '@prisma/client';
import z from 'zod';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __db__: PrismaClient | undefined;
}

// This module is the single source of truth for the PrismaClient. It is
// bundled into the Remix server build, and server.ts (Socket.IO) reuses the
// same instance through the `global.__db__` singleton below rather than
// creating its own — see the note in server.ts. Keeping one client means one
// connection pool for the whole process. Two independent pools competing for
// the same database is what starved the Remix loaders and produced the P2024
// "Timed out fetching a new connection from the connection pool" errors.
//
// The singleton is used in every environment (not just development): in
// production the two bundles still share this one process, so they must share
// the client too.
if (!global.__db__) {
  global.__db__ = getClient();
}
prisma = global.__db__;

function getClient() {
  const DATABASE_URL = z.string().parse(process.env.DATABASE_URL);

  const databaseUrl = new URL(DATABASE_URL);

  // Size the pool explicitly instead of relying on Prisma's CPU-based default
  // (`num_cpus * 2 + 1`), which is only 3 on the single-CPU host and is what
  // let the pool run dry under load. Both values are overridable via the
  // connection string itself or the env vars below.
  //
  // NOTE on horizontal scaling: connection_limit is per process. The database
  // sees up to `connection_limit * <number of app instances>` connections, so
  // it must stay under Postgres `max_connections` (minus any headroom for
  // migrations/psql). The default below is sized for the current
  // single-instance deployment; if you scale to multiple instances, lower
  // DATABASE_CONNECTION_LIMIT so the total stays within budget.
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
  // Connect eagerly to warm the pool, but don't let a transient startup
  // failure (database briefly unreachable during a deploy/failover) become an
  // unhandled rejection that crashes the process — Prisma will reconnect
  // lazily on the first query.
  client.$connect().catch((error) => {
    console.error('Prisma failed to connect eagerly; will retry lazily', error);
  });

  return client;
}

export { prisma };
