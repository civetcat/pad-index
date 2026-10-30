const superLimitBreakPercent = {
  hp: 10,
  atk: 5,
  rcv: 5,
} as const;

export type StatKind = keyof typeof superLimitBreakPercent;

const plusPerPoint: Record<StatKind, number> = {
  hp: 10,
  atk: 5,
  rcv: 3,
};

export const plusTiers = [
  { label: "+297", points: 99 },
  { label: "+300", points: 100 },
  { label: "+891", points: 297 },
] as const;

export function plusBonus(kind: StatKind, points: number) {
  return points * plusPerPoint[kind];
}

export function statAtLevel({
  min,
  max,
  scale,
  maxLevel,
  limitBreakPercent,
  level,
  kind,
  canLimitBreak = (limitBreakPercent ?? 0) > 0,
}: {
  min: number | null;
  max: number | null;
  scale: number | null;
  maxLevel: number | null;
  limitBreakPercent: number | null;
  level: number;
  kind: StatKind;
  canLimitBreak?: boolean;
}) {
  if (min == null || max == null || maxLevel == null || maxLevel < 1 || level < 1) {
    return null;
  }
  if (level > (canLimitBreak ? 120 : maxLevel)) {
    return null;
  }
  const progress = maxLevel === 1 || level >= maxLevel ? 1 : (level - 1) / (maxLevel - 1);
  let value = min + (max - min) * progress ** (scale ?? 1);
  if (level > maxLevel) {
    const through110 = Math.min(level - maxLevel, 11);
    const through120 = Math.max(0, level - 110);
    value += max * ((limitBreakPercent ?? 0) / 100) * (through110 / 11);
    value += max * (superLimitBreakPercent[kind] / 100) * (through120 / 10);
  }
  return Math.round(value);
}
