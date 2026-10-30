export function multipliedAttack(baseAtk: number, multipliers: number[]) {
  return multipliers.reduce((total, multiplier) => total * multiplier, baseAtk);
}

export function skillLevelOneCooldown(initialCooldown: number | null) {
  return initialCooldown;
}
