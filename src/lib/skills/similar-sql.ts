import { type SQL, sql } from "drizzle-orm";
import { skillTextReplacements, substituteSignals } from "@/lib/skills/similar";

export function strippedSkillText(expression: SQL = sql`skills.description`) {
  let value = expression;
  for (const digit of "0123456789") {
    value = sql`replace(${value}, ${digit}, '')`;
  }
  for (const extra of ["\n", "\r", " ", "　", "."]) {
    value = sql`replace(${value}, ${extra}, '')`;
  }
  return sql`replace(${value}, '無効化', '無効')`;
}

export function normalizedSkillText(expression: SQL = sql`skills.description`) {
  return skillTextReplacements.reduce(
    (value, [from, to]) => sql`replace(${value}, ${from}, ${to})`,
    expression,
  );
}

export function likenessMatch(descriptions: string[]) {
  const marks = new Set<string>();
  const shapes = new Set<string>();
  for (const description of descriptions) {
    const signal = substituteSignals(description);
    if (signal.marks.length > 0) {
      for (const mark of signal.marks) {
        marks.add(mark);
      }
    } else {
      for (const shape of signal.shapes) {
        shapes.add(shape);
      }
    }
  }
  const parts = [
    ...[...marks].slice(0, 8).map((mark) => sql`${normalizedSkillText()} LIKE ${`%${mark}%`}`),
    ...[...shapes].slice(0, 16).map((shape) => sql`instr(${strippedSkillText()}, ${shape}) > 0`),
  ];
  if (parts.length === 0) {
    return null;
  }
  return parts.reduce((left, right) => sql`${left} OR ${right}`);
}
