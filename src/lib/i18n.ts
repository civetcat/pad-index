export type DisplayLang = "cht" | "ja" | "en";

export function parseDisplayLang(value: string | undefined): DisplayLang {
  return value === "ja" || value === "en" ? value : "cht";
}

export function nameForLang(
  monster: { name: string; nameEn: string | null; nameCht: string | null },
  lang: DisplayLang,
) {
  if (lang === "en") {
    return monster.nameEn || monster.name;
  }
  if (lang === "ja") {
    return monster.name;
  }
  return monster.nameCht || monster.name || monster.nameEn || "";
}

export function secondaryNames(
  monster: { name: string; nameEn: string | null; nameCht: string | null },
  primary: string,
) {
  return [monster.name, monster.nameCht, monster.nameEn].filter(
    (value): value is string => Boolean(value) && value !== primary,
  );
}
