import path from "path";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import { createServer } from "http";
import { Server } from "socket.io";
import type { Like, Message, PrismaClient } from "@prisma/client";
import type { LikeWithUser } from "~/models/like.server";

const app = express();

// You need to create the HTTP server from the Express app
const httpServer = createServer(app);

// Reuse the single PrismaClient owned by app/db.server.ts instead of creating a
// second one here. This file and db.server.ts are transpiled into separate
// bundles that can't import each other at runtime, so we reach the shared
// instance through the `global.__db__` singleton db.server.ts populates (its
// ambient `declare global` is visible here project-wide). db.server.ts runs at
// startup via `require(BUILD_DIR)` — at module load in production and in the
// listen() callback in development — both of which happen before any socket
// connection (a socket only opens after a page has loaded over HTTP), so the
// client is always initialized by the time these handlers run. A second
// independent client would open its own pool and starve the Remix loaders,
// which is what caused the P2024 connection-pool timeouts.
function getPrisma(): PrismaClient {
  if (!global.__db__) {
    throw new Error(
      "Prisma client is not initialized. app/db.server.ts (bundled into the Remix build) must be loaded before the Socket.IO handlers run a query."
    );
  }
  return global.__db__;
}

// And then attach the socket.io server to the HTTP server
const io = new Server(httpServer);

io.on("connection", (socket) => {
  // from this point you are on the WS connection with a specific client
  console.log(socket.id, "connected");

  socket.emit("confirmation", "connected!");

  socket.on("joinPage", (postId) => {
    socket.join(postId);
  });

  socket.on("leavePage", (postId) => {
    socket.leave(postId);
  });

  socket.on("catchUp", async ({ postId, lastMessageTimestamp }) => {
    if (!postId) return;

    const prisma = getPrisma();
    const messages = await prisma.message.findMany({
      where: {
        postId,
        // gte (not gt) so a message sharing the exact timestamp of our newest
        // known message isn't skipped; the client dedups by id anyway.
        ...(lastMessageTimestamp
          ? { createdAt: { gte: new Date(lastMessageTimestamp) } }
          : {}),
      },
      // Ascending so each prepended message ends up in the correct (desc) order
      // on the client, which prepends every "messagePosted" it receives.
      orderBy: { createdAt: "asc" },
      include: {
        user: true,
        likes: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const message of messages) {
      socket.emit("messagePosted", message);
    }

    // Likes have no timestamp and unlikes are row deletes, so missed like
    // activity can't be replayed incrementally the way messages are. Instead we
    // send the authoritative set of all likes for the post and let the client
    // reconcile, which recovers both likes added to old messages and unlikes
    // that happened while this client was disconnected.
    const likes = await prisma.like.findMany({
      where: { message: { postId } },
      include: { user: true },
    });
    socket.emit("likesSync", { postId, likes });
  });

  socket.on("messagePosted", async (message: Message) => {
    if (!message) return;

    const prisma = getPrisma();
    const messageWithUser = await prisma.message.findFirst({
      where: { id: message.id },
      include: {
        user: true,
        likes: {
          include: {
            user: true,
          },
        },
      },
    });
    socket.broadcast.to(message.postId).emit("messagePosted", messageWithUser);
  });

  socket.on("messageEdited", async (message: Message) => {
    if (!message) return;

    const prisma = getPrisma();
    const messageWithUser = await prisma.message.findFirst({
      where: { id: message.id },
      include: {
        user: true,
        likes: {
          include: {
            user: true,
          },
        },
      },
    });
    socket.broadcast.to(message.postId).emit("messageEdited", messageWithUser);
  });

  socket.on("likePosted", async (like: Like) => {
    const { id } = like;

    const prisma = getPrisma();
    const fullLike = await prisma.like.findFirst({
      where: { id },
      include: {
        user: true,
        message: true,
      },
    });

    if (!fullLike) return;

    socket.broadcast.to(fullLike.message.postId).emit("likePosted", fullLike);
  });

  socket.on("unlikePosted", async (unlike: LikeWithUser) => {
    if (!unlike) return;

    socket.broadcast.to(unlike.message.postId).emit("unlikePosted", unlike);
  });
});

app.use((req, res, next) => {
  // helpful headers:
  res.set("x-fly-region", process.env.FLY_REGION ?? "unknown");
  res.set("Strict-Transport-Security", `max-age=${60 * 60 * 24 * 365 * 100}`);

  // /clean-urls/ -> /clean-urls
  if (req.path.endsWith("/") && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    const safepath = req.path.slice(0, -1).replace(/\/+/g, "/");
    res.redirect(301, safepath + query);
    return;
  }
  next();
});

// if we're not in the primary region, then we need to make sure all
// non-GET/HEAD/OPTIONS requests hit the primary region rather than read-only
// Postgres DBs.
// learn more: https://fly.io/docs/getting-started/multi-region-databases/#replay-the-request
app.all("*", function getReplayResponse(req, res, next) {
  const { method, path: pathname } = req;
  const { PRIMARY_REGION, FLY_REGION } = process.env;

  const isMethodReplayable = !["GET", "OPTIONS", "HEAD"].includes(method);
  const isReadOnlyRegion =
    FLY_REGION && PRIMARY_REGION && FLY_REGION !== PRIMARY_REGION;

  const shouldReplay = isMethodReplayable && isReadOnlyRegion;

  if (!shouldReplay) return next();

  const logInfo = {
    pathname,
    method,
    PRIMARY_REGION,
    FLY_REGION,
  };
  console.info(`Replaying:`, logInfo);
  res.set("fly-replay", `region=${PRIMARY_REGION}`);
  return res.sendStatus(409);
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "build");

app.all(
  "*",
  MODE === "production"
    ? createRequestHandler({ build: require(BUILD_DIR) })
    : (...args) => {
        purgeRequireCache();
        const requestHandler = createRequestHandler({
          build: require(BUILD_DIR),
          mode: MODE,
        });
        return requestHandler(...args);
      }
);

const port = process.env.PORT || 3000;

httpServer.listen(port, () => {
  // require the built app so we're ready when the first request comes in
  require(BUILD_DIR);
  console.log(`✅ app ready: http://localhost:${port}`);
});

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key];
    }
  }
}
