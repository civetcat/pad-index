export const skillPhrases: Array<{ ja: string; cht: string }> = [
  ["自分以外のスキルが", "其他技能"],
  ["スキルが進化", "技能進化"],
  ["ダメージ吸収を無効", "傷害吸收無效"],
  ["属性吸収を無効", "屬性吸收無效"],
  ["ダメージ無効を貫通", "傷害無效貫通"],
  ["ダメージ上限", "傷害上限"],
  ["固定ダメージ", "固定傷害"],
  ["バインドを解除", "解除封鎖"],
  ["ロックを解除", "解除鎖定"],
  ["[ロック]", "[鎖定]"],
  ["消せないドロップ", "消不掉的珠子"],
  ["ドロップを動かせる", "可以移動珠子"],
  ["時を止めて", "使時間停止，並"],
  ["覚醒無効", "覺醒無效"],
  ["バインド", "封鎖"],
  ["ターンの間", "回合內"],
  ["秒間", "秒內"],
  ["敵全体", "敵人全體"],
  ["敵1体", "單一敵人"],
  ["攻撃力", "攻擊力"],
  ["回復力", "回復力"],
  ["火属性", "火屬性"],
  ["水属性", "水屬性"],
  ["木属性", "木屬性"],
  ["光属性", "光屬性"],
  ["闇属性", "暗屬性"],
  ["属性攻撃", "屬性攻擊"],
  ["属性ダメージ", "屬性傷害"],
  ["盤面を", "將盤面"],
  ["に変化", "變成"],
  ["全回復", "全部回復"],
  ["HPを", "將HP"],
  ["残りHP", "剩餘HP"],
  ["操作時間", "操作時間"],
  ["防御力", "防禦力"],
  ["ドロップ", "珠子"],
  ["軽減", "減傷"],
  ["遅延", "延遲"],
  ["遅らせる", "延遲"],
  ["コンボ", "Combo"],
  ["リーダー", "隊長"],
  ["自分", "自身"],
  ["全体", "全體"],
  ["減少", "減少"],
  ["攻撃", "攻擊"],
  ["回復", "回復"],
  ["敵", "敵人"],
  ["毒", "毒"],
  ["重力", "重力"],
  ["倍", "倍"],
].map(([ja, cht]) => ({ ja, cht }));

const ordered = [...skillPhrases].sort((left, right) => right.ja.length - left.ja.length);

export function skillTextCht(input: string) {
  let text = input.replaceAll("|5属性|", "").replaceAll("^qs^", "").replaceAll("^p", "");
  const slots: string[] = [];
  for (const phrase of ordered) {
    if (!text.includes(phrase.ja)) {
      continue;
    }
    const token = `\u0000${slots.length}\u0000`;
    slots.push(phrase.cht);
    text = text.replaceAll(phrase.ja, token);
  }
  text = text
    .replaceAll("の", "的")
    .replaceAll("と", "和")
    .replaceAll("を", "")
    .replaceAll("が", "")
    .replaceAll("に", "")
    .replaceAll("で", "")
    .replaceAll("、", "，")
    .replace(/\u0000(\d+)\u0000/g, (_match, index: string) => slots[Number(index)] ?? "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return text;
}
