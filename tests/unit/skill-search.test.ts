import { describe, expect, it } from "vitest";
import { skillTextCht } from "@/lib/skills/chinese";
import { skillSearchNeedles } from "@/lib/skills/search";
import { effectMarksIn, skillShapes, substituteSignals } from "@/lib/skills/similar";

describe("skill text search", () => {
  it("keeps the typed phrase instead of splitting similar words", () => {
    expect(skillSearchNeedles("火")).toEqual([]);
    expect(skillSearchNeedles("減傷")).toEqual(["減傷", "軽減"]);
    expect(skillSearchNeedles("ヒートブレス")).toEqual(["ヒートブレス"]);
    expect(skillSearchNeedles("覺醒無效 1.5")).toEqual(["覺醒無效", "覚醒無効", "1.5"]);
    expect(skillSearchNeedles("10 回")).toEqual(["10", "回復"]);
    expect(skillSearchNeedles("10回")).toEqual(["10", "回復"]);
  });

  it("treats different turn counts of the same effect as the same shape", () => {
    expect(skillShapes("13ターンの間、属性吸収を無効化。")).toEqual(
      skillShapes("10ターンの間、属性吸収を無効化。"),
    );
    expect(effectMarksIn("13ターンの間、属性吸収を無効化。")).toEqual(["属性吸収を無効"]);
    expect(effectMarksIn("10ターンの間、ダメージ吸収と属性吸収を無効化。")).toEqual([
      "属性吸収を無効",
      "ダメージ吸収を無効",
    ]);
    expect(effectMarksIn("7ターンの間、属性吸収を\n無効化。")).toEqual(["属性吸収を無効"]);
    expect(substituteSignals("10ターンの間、属性吸収を無効化。\n盤面を[火][水][回復]に変化。")).toEqual({
      marks: ["属性吸収を無効"],
      shapes: [],
    });
    expect(substituteSignals("2ターンの間、属性吸収とダメージ吸収を無効化。").marks).toEqual([
      "属性吸収を無効",
      "ダメージ吸収を無効",
    ]);
    expect(substituteSignals("火属性の攻撃力が5倍。\n操作時間が5秒延長。").shapes).toEqual(["火属性の攻撃力が倍"]);
    expect(substituteSignals("火属性のHPと攻撃力が5倍。操作時間が3秒延長。\n火光の同時攻撃で攻撃力が7.5倍、3コンボ加算。").shapes)
      .not.toContain("操作時間が秒延長");
  });

  it("reads the Japanese skill with the same numbers", () => {
    expect(skillTextCht("回復力×10倍のHP回復、バインドと覚醒無効を全回復。\n7ターンの間、回復力が1.5倍。")).toBe(
      "回復力×10倍的HP回復，封鎖和覺醒無效全部回復。\n7回合內，回復力1.5倍。",
    );
    expect(skillTextCht("敵全体に攻撃力×10倍の火属性攻撃。")).toBe("敵人全體攻擊力×10倍的火屬性攻擊。");
  });
});
