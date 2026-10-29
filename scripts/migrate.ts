import { migrateDatabase } from "../src/lib/db/migrate";

migrateDatabase().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
