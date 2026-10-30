import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { dataSource } from "@/lib/source";
import { dataSources } from "./schema";

export function resolveDatabaseUrl(url = process.env.DATABASE_URL) {
  return url && url.length > 0 ? url : "file:./data/pad.sqlite";
}

function ensureFileParent(url: string) {
  if (!url.startsWith("file:")) {
    return;
  }
  const filePath = url.slice("file:".length);
  mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

export async function openDatabase(url = resolveDatabaseUrl()) {
  ensureFileParent(url);
  const client = createClient({ url });
  const db = drizzle(client);
  return { client, db, url };
}

export async function applyMigrations(url = resolveDatabaseUrl()) {
  const opened = await openDatabase(url);
  try {
    await migrate(opened.db, {
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });
    await opened.db
      .insert(dataSources)
      .values({
        sourceName: dataSource.name,
        repositoryUrl: dataSource.repositoryUrl,
        branch: dataSource.branch,
        dataPath: dataSource.dataPath,
        status: "not_imported",
      })
      .onConflictDoNothing();
    return opened;
  } catch (error) {
    opened.client.close();
    throw error;
  }
}

export async function migrateDatabase(url = resolveDatabaseUrl()) {
  const opened = await applyMigrations(url);
  opened.client.close();
}

