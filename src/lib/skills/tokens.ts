export type SkillTokenIcon =
  | { kind: "orb"; row: number; label: string }
  | { kind: "lock"; label: string }
  | { kind: "awakening"; code: number; label: string }
  | { kind: "type"; row: number; label: string }
  | { kind: "skill"; column: number; row: number; label: string };

const orbs: Record<string, SkillTokenIcon> = {
  火: { kind: "orb", row: 0, label: "火" },
  水: { kind: "orb", row: 1, label: "水" },
  木: { kind: "orb", row: 2, label: "木" },
  光: { kind: "orb", row: 3, label: "光" },
  闇: { kind: "orb", row: 4, label: "暗" },
  回復: { kind: "orb", row: 5, label: "回復" },
  お邪魔: { kind: "orb", row: 6, label: "廢珠" },
  毒: { kind: "orb", row: 7, label: "毒" },
  猛毒: { kind: "orb", row: 8, label: "猛毒" },
  爆弾: { kind: "orb", row: 9, label: "炸彈" },
};

const types: Record<string, SkillTokenIcon> = {
  バランスタイプ: { kind: "type", row: 1, label: "平衡" },
  体力タイプ: { kind: "type", row: 2, label: "體力" },
  回復タイプ: { kind: "type", row: 3, label: "回復" },
  ドラゴンタイプ: { kind: "type", row: 4, label: "龍" },
  神タイプ: { kind: "type", row: 5, label: "神" },
  攻撃タイプ: { kind: "type", row: 6, label: "攻擊" },
  悪魔タイプ: { kind: "type", row: 7, label: "惡魔" },
  マシンタイプ: { kind: "type", row: 8, label: "機械" },
  強化合成用モンスター: { kind: "type", row: 14, label: "強化合成用" },
};

const skillIcons: Record<string, SkillTokenIcon> = {
  強化ドロップ目覚め: { kind: "skill", column: 0, row: 33, label: "強化珠" },
  釘ドロップ: { kind: "skill", column: 0, row: 35, label: "釘珠" },
  コンボドロップ: { kind: "skill", column: 0, row: 44, label: "連擊珠" },
};

const awakenings: Record<string, number> = {
  "2体攻撃": 27,
  "2体攻撃+": 96,
  HP強化: 1,
  攻撃強化: 2,
  回復強化: 3,
  自動回復: 9,
  バインド回復: 20,
  スキルブースト: 21,
  火列強化: 22,
  木列強化: 24,
  スキルチャージ: 51,
  "L字消し攻撃": 59,
  超つなげ消し強化: 61,
  火コンボ強化: 73,
  水コンボ強化: 74,
  木コンボ強化: 75,
  光コンボ強化: 76,
  闇コンボ強化: 77,
  十字消し攻撃: 78,
  ドラゴンキラー: 31,
  神キラー: 32,
  悪魔キラー: 33,
  "\u30d0\u30e9\u30f3\u30b9\u30ad\u30e9\u30fc": 35,
  攻撃キラー: 36,
  体力キラー: 37,
  回復キラー: 38,
  "HP50%以上強化": 57,
  "HP50%以下強化": 58,
  ダンジョンボーナス: 64,
  ダメージ無効貫通攻撃: 48,
  火水同時攻撃: 133,
  水木同時攻撃: 134,
  木火同時攻撃: 135,
  水縦消し攻撃: 150,
  木縦消し攻撃: 151,
  闇縦消し攻撃: 153,
  "3色攻撃強化": 79,
  "3色攻撃強化+": 112,
  "4色攻撃強化": 80,
  "5色ドロップ強化": 137,
  "5色攻撃強化": 81,
  "L字消し攻撃+": 108,
  "T字消し攻撃": 126,
  アフタヌーンティー: 132,
  "お邪魔耐性+": 69,
  ガードブレイク: 44,
  コンボ強化: 43,
  "コンボ強化+": 107,
  スキル遅延耐性: 136,
  "ダメージ無効貫通攻撃+": 109,
  チームHP強化: 46,
  ドラゴンタイプ追加: 83,
  "バインド回復+": 115,
  "バインド耐性+": 52,
  バランスタイプ追加: 87,
  マシンタイプ追加: 86,
  悪魔タイプ追加: 85,
  "暗闇耐性+": 68,
  "闇コンボ強化+": 125,
  "闇ドロップ強化+": 103,
  闇列強化: 26,
  雲耐性: 54,
  "火コンボ強化+": 121,
  "火ドロップ強化+": 99,
  回復タイプ追加: 90,
  回復ドロップ強化: 29,
  "回復ドロップ強化+": 104,
  "光ドロップ強化+": 102,
  光列強化: 25,
  攻撃タイプ追加: 88,
  "自動回復+": 98,
  "十字消し攻撃+": 110,
  熟成: 130,
  神タイプ追加: 84,
  "水コンボ強化+": 122,
  "水ドロップ強化+": 100,
  水列強化: 23,
  全パラメータ強化: 127,
  "操作時間延長+": 53,
  操作不可耐性: 55,
  体力タイプ追加: 89,
  超コンボ強化: 61,
  毒ドロップの加護: 72,
  "毒耐性+": 70,
  浮遊: 106,
  部位破壊ボーナス: 131,
  封印耐性: 28,
  "副属性変更・闇": 95,
  "副属性変更・火": 91,
  "副属性変更・光": 94,
  "副属性変更・水": 92,
  "副属性変更・木": 93,
  "木ドロップ強化+": 101,
};

export function skillTokenIcon(name: string): SkillTokenIcon | null {
  if (name === "ロック") {
    return { kind: "lock", label: "鎖定" };
  }
  const awakening = awakenings[name];
  if (awakening) {
    return { kind: "awakening", code: awakening, label: name };
  }
  return orbs[name] ?? types[name] ?? skillIcons[name] ?? null;
}
