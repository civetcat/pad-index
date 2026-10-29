export const dataSource = {
  name: "pad-dash-formation",
  repositoryUrl: "https://github.com/Mapaler/PADDashFormation",
  branch: "master",
  dataPath: "monsters-info",
  files: {
    monstersJa: "monsters-info/mon_ja.json",
    monstersEn: "monsters-info/mon_en.json",
    monstersKo: "monsters-info/mon_ko.json",
    skillsJa: "monsters-info/skill_ja.json",
    skillsEn: "monsters-info/skill_en.json",
    skillsKo: "monsters-info/skill_ko.json",
    version: "monsters-info/ckey.json",
  },
} as const;

export type DataSourceConfig = typeof dataSource;
