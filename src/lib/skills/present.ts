export function presentSkill(description: string) {
  const note = description.match(/\^qs\^([\s\S]*?)\^p/)?.[1]?.trim() ?? "";
  const body = description.replace(/\^qs\^[\s\S]*?\^p/, "").trim();
  const haste = body.match(/自分以外のスキルが(\d+)ターン溜まる/);
  return {
    note,
    body,
    hasteTurns: haste ? Number(haste[1]) : null,
    assistVanishes: /アシストが消滅/.test(note),
  };
}
