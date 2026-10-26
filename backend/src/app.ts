import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { errorHandler, HttpError, notFoundHandler } from "./middleware/error.middleware.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import analysisRouter from "./routes/analysis.routes.js";
import techStackRouter from "./routes/techStack.routes.js";
import roadmapRouter from "./routes/roadmap.routes.js";
import taskRouter from "./routes/task.routes.js";
import architectureRouter from "./routes/architecture.routes.js";
import chatRouter from "./routes/chat.routes.js";

const app = express();

// Render (and most PaaS providers) terminate TLS in front of the app and send
// X-Forwarded-For. Trusting the first proxy keeps rate limiting per client
// instead of putting every visitor in one bucket.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = new Set(env.clientURLs);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (health checks, curl, server-to-server)
      // are allowed. Browser requests must match CLIENT_URL / CLIENT_URLS.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new HttpError(
          403,
          `Origin "${origin}" is not allowed. Add it to CLIENT_URL or CLIENT_URLS on the API service.`
        )
      );
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

if (!env.isProduction) {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "System Designer API",
    health: "/api/health",
  });
});

// Health check must stay outside the rate limiter so Render's probes are never
// rejected with 429.
app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? "System Designer API is running"
      : "API is running but the database is not connected",
    database: databaseConnected ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please wait a few minutes and try again.",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/projects/:id/analysis", analysisRouter);
app.use("/api/projects/:id/tech-stack", techStackRouter);
app.use("/api/projects/:id/roadmap", roadmapRouter);
app.use("/api/projects/:id", taskRouter);
app.use("/api/projects/:id/architecture", architectureRouter);
app.use("/api/projects/:id/chat", chatRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
