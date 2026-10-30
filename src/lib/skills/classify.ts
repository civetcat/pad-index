export const PARSER_VERSION = "pad-index-skill-2";

export const effectCategories = [
  "attribute_damage",
  "attack_boost",
  "hp_boost",
  "rcv_boost",
  "type_boost",
  "heal",
  "delay",
  "haste",
  "orb_change",
  "board_change",
  "orb_generate",
  "orb_enhance",
  "lock_clear",
  "damage_absorb_void",
  "attribute_absorb_void",
  "damage_void_pierce",
  "damage_cap",
  "unbind",
  "awaken_bind_clear",
  "defense_break",
  "shield",
  "combo_boost",
  "fixed_damage",
  "leader_swap",
  "time_extend",
  "skyfall",
  "poison",
  "gravity",
  "skill_evolve",
] as const;

export type EffectCategory = (typeof effectCategories)[number];

export type ClassifiedEffect = {
  effectCategory: EffectCategory | "unparsed";
  effectCode: string | null;
  valueJson: string | null;
  duration: number | null;
  target: string | null;
  rawEffectText: string;
  parserVersion: string;
  parseStatus: "parsed" | "partial" | "unparsed";
};

const textRules: Array<{ category: EffectCategory; pattern: RegExp }> = [
  { category: "damage_absorb_void", pattern: /ダメージ吸収を無効|傷害吸收無效|damage absorb/i },
  { category: "attribute_absorb_void", pattern: /属性吸収を無効|屬性吸收無效|attribute absorb/i },
  { category: "damage_void_pierce", pattern: /ダメージ無効を貫通|傷害無效貫通|void pierce/i },
  { category: "damage_cap", pattern: /ダメージ上限/ },
  { category: "skill_evolve", pattern: /スキルが進化/ },
  { category: "haste", pattern: /スキルが.+溜まる|スキルターン/ },
  { category: "board_change", pattern: /盤面を/ },
  { category: "lock_clear", pattern: /ロック.*解除/ },
  { category: "orb_enhance", pattern: /を強化|ドロップ強化/ },
  { category: "attribute_damage", pattern: /属性攻撃|属性ダメージ/ },
  { category: "attack_boost", pattern: /攻撃力が/ },
  { category: "hp_boost", pattern: /HPが|HPと/ },
  { category: "rcv_boost", pattern: /回復力が/ },
  { category: "type_boost", pattern: /タイプ\]の/ },
  { category: "heal", pattern: /HPを|HPが回復|回復する|回复/ },
  { category: "delay", pattern: /遅延(?!耐性)|遅らせる|延遲|delay/i },
  { category: "orb_change", pattern: /に変化|轉換|に変換|change orbs/i },
  { category: "orb_generate", pattern: /生成/ },
  { category: "unbind", pattern: /バインドを解除|封鎖を解除|bindを解除/i },
  { category: "awaken_bind_clear", pattern: /覚醒無効を解除|覺醒無效/ },
  { category: "defense_break", pattern: /防御力|防禦力/ },
  { category: "shield", pattern: /軽減|減免|半減|シールド|shield/i },
  { category: "combo_boost", pattern: /コンボ加算|コンボで|Combo/i },
  { category: "fixed_damage", pattern: /固定ダメージ|固定傷害|固定\d|fixed damage/i },
  { category: "leader_swap", pattern: /リーダーと入れ替|隊長換/i },
  { category: "time_extend", pattern: /操作時間|移動時間|time extend/i },
  { category: "skyfall", pattern: /落ちてくる|落ちやすく|天降|skyfall/i },
  { category: "poison", pattern: /毒|poison/i },
  { category: "gravity", pattern: /重力|gravity/i },
];

function skillClauses(description: string) {
  const clauses = description
    .split(/\n+|。/)
    .map((clause) => clause.trim())
    .filter(Boolean);
  return clauses.length > 0 ? clauses : [description];
}

function durationOf(clause: string) {
  const match = clause.match(/(\d+)ターン/);
  return match ? Number(match[1]) : null;
}

export function classifySkill(input: {
  type: number;
  description: string;
  params: unknown[];
}) {
  const effects: ClassifiedEffect[] = [];
  const text = input.description;
  const clauses = skillClauses(text);
  if (input.type === 0 && input.params.length >= 2 && /属性攻撃|属性ダメージ/.test(text)) {
    effects.push({
      effectCategory: "attribute_damage",
      effectCode: "type:0",
      valueJson: JSON.stringify({
        attribute: input.params[0],
        rawMultiplier: input.params[1],
        observedScale: "sample id 1 uses 1000 for ×10",
      }),
      duration: durationOf(text),
      target: "enemy",
      rawEffectText: text,
      parserVersion: PARSER_VERSION,
      parseStatus: "parsed",
    });
  }
  for (const clause of clauses) {
    for (const rule of textRules) {
      if (!rule.pattern.test(clause)) {
        continue;
      }
      if (effects.some((effect) => effect.effectCategory === rule.category && effect.rawEffectText === clause)) {
        continue;
      }
      effects.push({
        effectCategory: rule.category,
        effectCode: `type:${input.type}`,
        valueJson: JSON.stringify({ params: input.params }),
        duration: durationOf(clause),
        target: null,
        rawEffectText: clause,
        parserVersion: PARSER_VERSION,
        parseStatus: "partial",
      });
    }
  }
  if (effects.length === 0) {
    effects.push({
      effectCategory: "unparsed",
      effectCode: `type:${input.type}`,
      valueJson: JSON.stringify({ params: input.params }),
      duration: durationOf(text),
      target: null,
      rawEffectText: text,
      parserVersion: PARSER_VERSION,
      parseStatus: "unparsed",
    });
  }
  return effects;
}

export const effectCategoryLabels: Record<string, string> = {
  attribute_damage: "屬性傷害",
  attack_boost: "攻擊倍率",
  hp_boost: "HP 倍率",
  rcv_boost: "回復力倍率",
  type_boost: "類型倍率",
  heal: "回復",
  haste: "縮短冷卻",
  board_change: "整盤轉珠",
  orb_enhance: "強化珠",
  lock_clear: "解除鎖定",
  damage_cap: "傷害上限",
  skill_evolve: "技能進化",
  delay: "延遲",
  orb_change: "轉珠",
  orb_generate: "生成珠子",
  damage_absorb_void: "傷害吸收無效",
  attribute_absorb_void: "屬性吸收無效",
  damage_void_pierce: "傷害無效貫通",
  unbind: "解除封鎖",
  awaken_bind_clear: "解除覺醒無效",
  defense_break: "減防",
  shield: "減傷",
  combo_boost: "增加 Combo",
  fixed_damage: "固定傷害",
  leader_swap: "交換隊長",
  time_extend: "延長轉珠時間",
  skyfall: "天降",
  poison: "毒",
  gravity: "重力",
  unparsed: "未解析",
};
