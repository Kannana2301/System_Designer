import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(
        `System Designer API running on port ${env.port} (${env.nodeEnv})`
      );
      console.log(`Health check: /api/health`);
      console.log(`Allowed frontend origin(s): ${env.clientURLs.join(", ")}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });

      // Do not hang forever if a connection refuses to close.
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
