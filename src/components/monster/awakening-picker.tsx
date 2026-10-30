"use client";

import { useState } from "react";
import { awakeningLabels, labelOrUnknown } from "@/lib/labels";

const sheet = "https://mapaler.github.io/PADDashFormation/images/awoken.png";

export function AwakeningPicker({
  awakenings,
  superAwakenings,
}: {
  awakenings: number[];
  superAwakenings: number[];
}) {
  const [selected, setSelected] = useState<number | null>(superAwakenings[0] ?? null);
  return (
    <section className="rounded-lg border border-line bg-card p-4">
      <h2 className="font-semibold">覺醒</h2>
      {awakenings.length === 0 ? (
        <p className="mt-2 text-sm text-muted">無</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {awakenings.map((code, index) => (
            <li key={`${code}-${index}`}>
              <AwakeningIcon code={code} />
            </li>
          ))}
        </ul>
      )}
      <h3 className="mt-4 font-medium">超覺醒</h3>
      {superAwakenings.length === 0 ? (
        <p className="mt-2 text-sm text-muted">無</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {superAwakenings.map((code) => (
            <OptionButton
              key={code}
              pressed={selected === code}
              onClick={() => setSelected(code)}
              code={code}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function OptionButton({
  pressed,
  onClick,
  code,
}: {
  pressed: boolean;
  onClick: () => void;
  code: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`rounded border px-2 py-1 ${pressed ? "border-accent bg-background" : "border-line"}`}
      onClick={onClick}
    >
      <AwakeningIcon code={code} />
    </button>
  );
}

export function AwakeningIcon({ code, compact = false }: { code: number; compact?: boolean }) {
  const label = labelOrUnknown(awakeningLabels, code, "覺醒");
  const icon = (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-block h-8 w-8 bg-no-repeat"
      style={{
        backgroundImage: `url(${sheet})`,
        backgroundPosition: `0 ${-code * 32}px`,
      }}
    />
  );
  if (compact) {
    return icon;
  }
  return (
    <span className="inline-flex flex-col items-center gap-1">
      {icon}
      <span className="max-w-16 text-center text-xs text-muted">{label}</span>
    </span>
  );
}
