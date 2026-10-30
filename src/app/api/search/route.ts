import { getAppDatabase } from "@/lib/db/app-db";
import { parseMonsterFilters } from "@/lib/queries/filters";
import { listMonsters } from "@/lib/queries/monsters";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = parseMonsterFilters({
    q: url.searchParams.get("q") ?? undefined,
    attr: url.searchParams.get("attr") ?? undefined,
    rarity: url.searchParams.get("rarity") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    awk: url.searchParams.get("awk") ?? undefined,
    effect: url.searchParams.get("effect") ?? undefined,
    slot: url.searchParams.get("slot") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
  });
  const database = await getAppDatabase();
  const result = await listMonsters(database.db, { ...filters, pageSize: 8 });
  return Response.json(result);
}
