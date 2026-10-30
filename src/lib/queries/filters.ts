export const PAGE_SIZE = 48;

export type MonsterFilters = {
  q: string;
  attribute?: number;
  rarity?: number;
  type?: number;
  awakenings: Array<{ code: number; count: number }>;
  skill: string;
  effect?: string;
  slot?: "active" | "leader";
  substitutes: boolean;
  page: number;
  pageSize: number;
};

export function parseMonsterFilters(
  params: Record<string, string | string[] | undefined>,
): MonsterFilters {
  return {
    q: first(params.q)?.trim() ?? "",
    attribute: optionalInt(first(params.attr)),
    rarity: optionalInt(first(params.rarity)),
    type: optionalInt(first(params.type)),
    awakenings: awakeningCounts(params.awk),
    skill: first(params.skill)?.trim() ?? "",
    effect: first(params.effect)?.trim() || undefined,
    slot: parseSlot(first(params.slot)),
    substitutes: first(params.sub) === "1",
    page: Math.max(1, optionalInt(first(params.page)) ?? 1),
    pageSize: PAGE_SIZE,
  };
}

export function catalogHref(
  filters: Partial<MonsterFilters>,
  page = filters.page ?? 1,
) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.attribute !== undefined) {
    params.set("attr", String(filters.attribute));
  }
  if (filters.rarity !== undefined) {
    params.set("rarity", String(filters.rarity));
  }
  if (filters.type !== undefined) {
    params.set("type", String(filters.type));
  }
  for (const awakening of filters.awakenings ?? []) {
    params.append("awk", awakening.count > 1 ? `${awakening.code}x${awakening.count}` : String(awakening.code));
  }
  if (filters.skill) {
    params.set("skill", filters.skill);
  }
  if (filters.effect) {
    params.set("effect", filters.effect);
  }
  if (filters.slot) {
    params.set("slot", filters.slot);
  }
  if (filters.substitutes) {
    params.set("sub", "1");
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSlot(value: string | undefined): "active" | "leader" | undefined {
  return value === "active" || value === "leader" ? value : undefined;
}

const maxAwakeningCount = 8;

function awakeningCounts(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const counts = new Map<number, number>();
  for (const item of raw) {
    const match = /^(\d+)(?:x(\d+))?$/.exec(item);
    if (!match) {
      continue;
    }
    const code = Number(match[1]);
    const count = Math.min(maxAwakeningCount, Number(match[2] ?? 1));
    if (code <= 0 || count <= 0) {
      continue;
    }
    counts.set(code, Math.max(counts.get(code) ?? 0, count));
  }
  return [...counts]
    .sort(([left], [right]) => left - right)
    .slice(0, 24)
    .map(([code, count]) => ({ code, count }));
}

function optionalInt(value: string | undefined) {
  if (!value || !/^-?\d+$/.test(value)) {
    return undefined;
  }
  return Number(value);
}
