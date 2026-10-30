import { desc, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { dataSources, upstreamChecks } from "@/lib/db/schema";
import { dataSource } from "@/lib/source";

export type UpstreamStatus =
  | "up_to_date"
  | "update_available"
  | "checking"
  | "failed"
  | "validation_failed";

export type UpstreamCheckResult = {
  status: UpstreamStatus;
  latestRevision: string | null;
  importedRevision: string | null;
  checkedAt: string;
  errorMessage: string | null;
  changedFiles: string[];
};

const headers = {
  "User-Agent": "pad-index",
  Accept: "application/vnd.github+json",
};

export async function checkUpstream(
  db: LibSQLDatabase,
  fetchImpl: typeof fetch = fetch,
): Promise<UpstreamCheckResult> {
  const checkedAt = new Date().toISOString();
  const source = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.sourceName, dataSource.name))
    .limit(1);
  const sourceRow = source[0];
  if (!sourceRow) {
    throw new Error("缺少資料來源設定");
  }
  await db
    .update(dataSources)
    .set({ status: "checking", lastCheckedAt: checkedAt })
    .where(eq(dataSources.id, sourceRow.id));

  try {
    const latest = await fetchLatestCommit(fetchImpl);
    if (!latest) {
      return persist(db, sourceRow.id, {
        status: "failed",
        latestRevision: null,
        importedRevision: sourceRow.latestImportedRevision,
        checkedAt,
        errorMessage: "GitHub 沒有回傳 commit",
        changedFiles: [],
      });
    }
    const imported = sourceRow.latestImportedRevision;
    const changedFiles = imported
      ? await fetchChangedFiles(fetchImpl, imported, latest.sha)
      : [];
    const status: UpstreamStatus =
      imported && imported === latest.sha ? "up_to_date" : "update_available";
    return persist(db, sourceRow.id, {
      status,
      latestRevision: latest.sha,
      importedRevision: imported,
      checkedAt,
      errorMessage: null,
      changedFiles,
    });
  } catch (error) {
    return persist(db, sourceRow.id, {
      status: "failed",
      latestRevision: null,
      importedRevision: sourceRow.latestImportedRevision,
      checkedAt,
      errorMessage: error instanceof Error ? error.message : "upstream check failed",
      changedFiles: [],
    });
  }
}

export async function latestUpstreamCheck(db: LibSQLDatabase) {
  const source = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(eq(dataSources.sourceName, dataSource.name))
    .limit(1);
  if (!source[0]) {
    return null;
  }
  const rows = await db
    .select()
    .from(upstreamChecks)
    .where(eq(upstreamChecks.sourceId, source[0].id))
    .orderBy(desc(upstreamChecks.id))
    .limit(1);
  return rows[0] ?? null;
}

async function persist(
  db: LibSQLDatabase,
  sourceId: number,
  result: UpstreamCheckResult,
) {
  await db.insert(upstreamChecks).values({
    sourceId,
    checkedAt: result.checkedAt,
    status: result.status,
    latestRevision: result.latestRevision,
    importedRevision: result.importedRevision,
    summaryJson: JSON.stringify({ changedFiles: result.changedFiles }),
    errorMessage: result.errorMessage,
  });
  await db
    .update(dataSources)
    .set({
      status: result.status,
      lastCheckedAt: result.checkedAt,
      latestCheckedRevision: result.latestRevision,
    })
    .where(eq(dataSources.id, sourceId));
  return result;
}

async function fetchLatestCommit(fetchImpl: typeof fetch) {
  const url = `https://api.github.com/repos/Mapaler/PADDashFormation/commits?path=${dataSource.dataPath}&per_page=1`;
  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}`);
  }
  const commits = (await response.json()) as { sha?: string }[];
  return commits[0]?.sha ? { sha: commits[0].sha } : null;
}

async function fetchChangedFiles(
  fetchImpl: typeof fetch,
  base: string,
  head: string,
) {
  const url = `https://api.github.com/repos/Mapaler/PADDashFormation/compare/${base}...${head}`;
  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub compare ${response.status}`);
  }
  const body = (await response.json()) as {
    files?: { filename: string; status: string }[];
  };
  return (body.files ?? [])
    .filter((file) => file.filename.startsWith(`${dataSource.dataPath}/`))
    .map((file) => `${file.status} ${file.filename}`);
}
