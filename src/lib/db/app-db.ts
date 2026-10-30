import { count, eq } from "drizzle-orm";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { dataSources, monsters } from "./schema";
import { openDatabase, resolveDatabaseUrl } from "./migrate";
import { dataSource } from "@/lib/source";

type Opened = Awaited<ReturnType<typeof openDatabase>>;

let opened: Opened | undefined;

export async function getAppDatabase() {
  const remote = await openD1();
  if (remote) {
    return remote;
  }
  if (!opened) {
    opened = await openDatabase(resolveDatabaseUrl());
  }
  return opened;
}

async function openD1() {
  try {
    const { env } = await import("cloudflare:workers");
    if (!env.DB) {
      return null;
    }
    return {
      db: drizzleD1(env.DB) as unknown as LibSQLDatabase,
      client: {
        execute: async () => ({ rows: [] }),
        close: () => undefined,
      },
      url: "d1",
    };
  } catch {
    return null;
  }
}

export async function catalogStatus() {
  try {
    const database = await getAppDatabase();
    const total = await database.db
      .select({ total: count() })
      .from(monsters)
      .where(eq(monsters.isEmpty, false));
    const source = await database.db
      .select({
        revision: dataSources.latestImportedRevision,
        importedAt: dataSources.lastSuccessfulImportAt,
        status: dataSources.status,
      })
      .from(dataSources)
      .where(eq(dataSources.sourceName, dataSource.name))
      .limit(1);
    return {
      ready: true as const,
      count: total[0]?.total ?? 0,
      revision: source[0]?.revision ?? null,
      importedAt: source[0]?.importedAt ?? null,
      status: source[0]?.status ?? "not_imported",
    };
  } catch {
    return {
      ready: false as const,
      count: 0,
      revision: null,
      importedAt: null,
      status: "not_imported",
    };
  }
}
