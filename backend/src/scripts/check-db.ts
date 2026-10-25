import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";

/** Quick connectivity check: `npm run db:check` */
const main = async (): Promise<void> => {
  await connectDB();

  const { host, name } = mongoose.connection;
  console.log(`MongoDB reachable at ${host}, database "${name}"`);

  await disconnectDB();
};

main().catch((error) => {
  console.error("MongoDB check failed:", error);
  process.exit(1);
});
