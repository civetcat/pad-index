import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.D1_DATABASE_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!accountId || !databaseId || !token) {
  throw new Error("Missing CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, or CLOUDFLARE_API_TOKEN");
}

const files = readdirSync("drizzle")
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const file of files) {
  const raw = readFileSync(path.join("drizzle", file), "utf8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
  console.log(`${file}: ${statements.length} statements`);
  for (const sql of statements) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      },
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${file} failed ${response.status}: ${text.slice(0, 400)}`);
    }
  }
}

console.log("migrations applied");
