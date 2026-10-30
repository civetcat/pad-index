const ignored = new Set(["スキルが進化", "さらに何か起こる"]);
const genericShapes = new Set([
  "操作時間が秒延長",
  "自分以外のスキルがターン溜まる",
  "全ドロップを強化",
]);

export const effectMarks = [
  "属性吸収を無効",
  "ダメージ吸収を無効",
  "ダメージ無効を貫通",
  "バインドを解除",
  "覚醒無効を解除",
  "覚醒無効を全回復",
] as const;

const primaryMarks = ["属性吸収を無効", "ダメージ吸収を無効", "ダメージ無効を貫通"] as const;

export const skillTextReplacements: Array<[string, string]> = [
  ["\n", ""],
  ["\r", ""],
  [" ", ""],
  ["　", ""],
  ["無効化", "無効"],
  ["ダメージ吸収と属性吸収を無効", "ダメージ吸収を無効、属性吸収を無効"],
  ["属性吸収とダメージ吸収を無効", "属性吸収を無効、ダメージ吸収を無効"],
  ["ダメージ吸収、属性吸収を無効", "ダメージ吸収を無効、属性吸収を無効"],
  ["属性吸収、ダメージ吸収を無効", "属性吸収を無効、ダメージ吸収を無効"],
];

export function normalizeSkillText(description: string) {
  return skillTextReplacements.reduce(
    (text, [from, to]) => text.replaceAll(from, to),
    description,
  );
}

export function effectMarksIn(description: string) {
  const text = normalizeSkillText(description);
  return effectMarks.filter((mark) => text.includes(mark));
}

export function substituteSignals(description: string) {
  const marks = effectMarksIn(description);
  const primary = primaryMarks.filter((mark) => marks.includes(mark));
  if (primary.length > 0) {
    return { marks: [...primary], shapes: [] as string[] };
  }
  if (marks.length > 0) {
    return { marks: [...marks], shapes: [] as string[] };
  }
  const shapes = skillShapes(description);
  const specific = shapes.filter((shape) => !genericShapes.has(shape));
  const chosen = specific.length > 0 ? specific : shapes;
  const longest = chosen.reduce((max, shape) => Math.max(max, shape.length), 0);
  return {
    marks: [] as string[],
    shapes: chosen.filter((shape) => shape.length === longest).slice(0, 2),
  };
}

export function skillShapes(description: string) {
  return [...new Set(
    description
      .split(/\n+|。/)
      .map((clause) => clause.trim())
      .filter((clause) => clause.length > 0 && !ignored.has(clause.replace(/\s/g, "")))
      .filter((clause) => /\d/.test(clause) || /吸収|無効|攻撃|回復|変化|盤面|バインド|軽減|貫通/.test(clause))
      .map(skillShape)
      .filter((shape) => shape.length >= 8),
  )].slice(0, 8);
}

export function skillShape(clause: string) {
  return clause
    .replace(/[0-9０-９]+(?:[．.][0-9０-９]+)?/g, "")
    .replaceAll("無効化", "無効")
    .replace(/\s/g, "");
}
