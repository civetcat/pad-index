export const PAGE_SIZE = 48;

export type MonsterFilters = {
  q: string;
  attribute?: number;
  rarity?: number;
  type?: number;
  awakening?: number;
  effect?: string;
  slot?: "active" | "leader";
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
    awakening: optionalInt(first(params.awk)),
    effect: first(params.effect)?.trim() || undefined,
    slot: parseSlot(first(params.slot)),
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
  if (filters.awakening !== undefined) {
    params.set("awk", String(filters.awakening));
  }
  if (filters.effect) {
    params.set("effect", filters.effect);
  }
  if (filters.slot) {
    params.set("slot", filters.slot);
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

function optionalInt(value: string | undefined) {
  if (!value || !/^-?\d+$/.test(value)) {
    return undefined;
  }
  return Number(value);
}
