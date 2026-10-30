"use client";

import { useState } from "react";
import { multipliedAttack } from "@/lib/calc";

export default function CalcPage() {
  const [baseAtk, setBaseAtk] = useState(1000);
  const [combo, setCombo] = useState(1);
  const [attribute, setAttribute] = useState(1);
  const [skill, setSkill] = useState(1);
  const result = multipliedAttack(baseAtk, [combo, attribute, skill]);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">倍率試算</h1>
      <p className="text-sm text-muted">
        這不是官方完整傷害公式。結果只是卡片攻擊力乘上你輸入的倍率，方便粗估，不能當成實戰傷害。
      </p>
      <form className="grid gap-3 rounded-lg border border-line bg-card p-4" onSubmit={(event) => event.preventDefault()}>
        <NumberField label="基礎攻擊" value={baseAtk} onChange={setBaseAtk} />
        <NumberField label="Combo 倍率" value={combo} onChange={setCombo} step="0.1" />
        <NumberField label="屬性倍率" value={attribute} onChange={setAttribute} step="0.1" />
        <NumberField label="技能倍率" value={skill} onChange={setSkill} step="0.1" />
        <p className="font-mono text-lg">{Number.isFinite(result) ? Math.round(result) : "無法計算"}</p>
      </form>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <input
        className="rounded border border-line bg-background px-3 py-2"
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
