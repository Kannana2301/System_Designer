import mongoose from "mongoose";
import { env } from "./env.js";

/** Atlas reports wrong/unknown credentials with these shapes. */
const isAuthError = (error: unknown): boolean => {
  const err = error as { code?: number; codeName?: string; message?: string };

  return (
    err?.code === 8000 || // AtlasError
    err?.code === 18 || // AuthenticationFailed
    err?.codeName === "AtlasError" ||
    err?.codeName === "AuthenticationFailed" ||
    /bad auth|authentication failed/i.test(err?.message ?? "")
  );
};

export const connectDB = async (): Promise<void> => {
  const mongoURI = env.mongoURI;

  if (!mongoURI) {
    console.error(
      "MongoDB connection failed: MONGODB_URI is not defined in backend/.env"
    );
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  try {
    await mongoose.connect(mongoURI, {
      dbName: env.dbName,
      serverSelectionTimeoutMS: 10_000,
    });

    console.log(
      `MongoDB connected successfully (db: ${mongoose.connection.name})`
    );
  } catch (error) {
    if (isAuthError(error)) {
      console.error(
        [
          "MongoDB connection failed: authentication failed (bad auth).",
          "The cluster is reachable, but the username/password in MONGODB_URI were rejected.",
          "Fix: MongoDB Atlas -> Database Access -> edit user -> Edit Password -> set a new password,",
          "then put it in backend/.env (URL-encode special characters such as @ as %40).",
        ].join("\n")
      );
    } else {
      console.error("MongoDB connection failed:", error);
    }

    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
