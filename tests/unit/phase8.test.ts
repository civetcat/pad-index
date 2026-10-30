import { describe, expect, it } from "vitest";
import { hashPassword, validPassword, validUsername, verifyPassword } from "@/lib/auth/password";
import { multipliedAttack, skillLevelOneCooldown } from "@/lib/calc";
import { classifySkill } from "@/lib/skills/classify";

describe("phase 8 helpers", () => {
  it("multiplies only the numbers the user entered", () => {
    expect(multipliedAttack(1000, [2, 1.5])).toBe(3000);
  });

  it("does not invent a shorter high-level cooldown", () => {
    expect(skillLevelOneCooldown(8)).toBe(8);
    expect(skillLevelOneCooldown(null)).toBeNull();
  });

  it("hashes passwords without storing the original text", async () => {
    const secret = await hashPassword("correct-horse");
    expect(secret.hash).not.toContain("correct-horse");
    expect(await verifyPassword("correct-horse", secret.hash, secret.salt)).toBe(true);
    expect(await verifyPassword("wrong-password", secret.hash, secret.salt)).toBe(false);
    expect(validUsername("pad_user")).toBe(true);
    expect(validUsername("名字")).toBe(false);
    expect(validPassword("short")).toBe(false);
  });

  it("classifies additional skill phrases without dropping the text", () => {
    const effects = classifySkill({
      type: 12,
      description: "操作時間が延びる。毒ダメージ。",
      params: [],
    });
    expect(effects.map((effect) => effect.effectCategory)).toEqual(
      expect.arrayContaining(["time_extend", "poison"]),
    );
  });
});
