import { describe, expect, it } from "vitest";
import { skillTextCht } from "@/lib/skills/chinese";
import { skillSearchNeedles } from "@/lib/skills/search";

describe("skill text search", () => {
  it("keeps the typed phrase instead of splitting similar words", () => {
    expect(skillSearchNeedles("火")).toEqual([]);
    expect(skillSearchNeedles("減傷")).toEqual(["減傷", "軽減"]);
    expect(skillSearchNeedles("ヒートブレス")).toEqual(["ヒートブレス"]);
    expect(skillSearchNeedles("覺醒無效 1.5")).toEqual(["覺醒無效", "覚醒無効", "1.5"]);
    expect(skillSearchNeedles("10 回")).toEqual(["10", "回復"]);
    expect(skillSearchNeedles("10回")).toEqual(["10", "回復"]);
  });

  it("reads the Japanese skill with the same numbers", () => {
    expect(skillTextCht("回復力×10倍のHP回復、バインドと覚醒無効を全回復。\n7ターンの間、回復力が1.5倍。")).toBe(
      "回復力×10倍的HP回復，封鎖和覺醒無效全部回復。\n7回合內，回復力1.5倍。",
    );
    expect(skillTextCht("敵全体に攻撃力×10倍の火属性攻撃。")).toBe("敵人全體攻擊力×10倍的火屬性攻擊。");
  });
});
