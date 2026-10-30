import { skillPhrases } from "@/lib/skills/chinese";

const extraPhrases: Array<[string, string]> = [
  ["傷吸無效", "ダメージ吸収を無効"],
  ["屬吸無效", "属性吸収を無効"],
  ["破無效", "ダメージ無効を貫通"],
  ["轉珠", "に変化"],
  ["转珠", "に変化"],
  ["轉換", "に変化"],
  ["转换", "に変化"],
  ["解封", "バインド"],
  ["封鎖", "バインド"],
  ["覺醒無效", "覚醒無効"],
  ["觉醒无效", "覚醒無効"],
  ["減傷", "軽減"],
  ["减伤", "軽減"],
  ["延遲", "遅延"],
  ["延迟", "遅延"],
  ["回合內", "ターンの間"],
  ["回合", "ターン"],
  ["珠子", "ドロップ"],
  ["攻擊力", "攻撃力"],
  ["攻击力", "攻撃力"],
  ["攻擊", "攻撃"],
  ["攻击", "攻撃"],
  ["回復力", "回復力"],
  ["回复力", "回復力"],
  ["回復", "回復"],
  ["回复", "回復"],
  ["火屬性", "火属性"],
  ["水屬性", "水属性"],
  ["木屬性", "木属性"],
  ["光屬性", "光属性"],
  ["暗屬性", "闇属性"],
  ["屬性", "属性"],
  ["属性", "属性"],
];

const reversePhrases = [
  ...skillPhrases.map((phrase) => [phrase.cht, phrase.ja] as [string, string]),
  ...extraPhrases,
]
  .filter(([chinese]) => chinese.length >= 2)
  .sort((left, right) => right[0].length - left[0].length);

export function skillSearchNeedles(input: string) {
  return input
    .normalize("NFKC")
    .split(/\s+/)
    .flatMap(splitShorthand)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .flatMap((part) => {
      const mapped = toJapanesePhrase(part);
      return mapped === part ? [part] : [part, mapped];
    })
    .filter((needle, index, all) => needle.length >= 2 && all.indexOf(needle) === index);
}

function splitShorthand(part: string) {
  const glued = /^(\d+(?:\.\d+)?)回$/.exec(part);
  if (glued) {
    return [glued[1] ?? "", "回復"];
  }
  if (part === "回") {
    return ["回復"];
  }
  return [part];
}

function toJapanesePhrase(input: string) {
  let text = input;
  for (const [chinese, japanese] of reversePhrases) {
    text = text.replaceAll(chinese, japanese);
  }
  return text.replaceAll("的", "の").replaceAll("和", "と").replaceAll("，", "、");
}
