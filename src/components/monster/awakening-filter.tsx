"use client";

import { useState } from "react";
import { AwakeningIcon } from "@/components/monster/awakening-picker";
import { awakeningLabels } from "@/lib/labels";

const maxAwakeningCount = 8;

export function AwakeningFilter({
  selected,
}: {
  selected: Array<{ code: number; count: number }>;
}) {
  const [counts, setCounts] = useState(() => new Map(selected.map((item) => [item.code, item.count])));

  function change(code: number, delta: number) {
    setCounts((current) => {
      const next = new Map(current);
      const count = Math.min(maxAwakeningCount, Math.max(0, (next.get(code) ?? 0) + delta));
      if (count === 0) {
        next.delete(code);
      } else {
        next.set(code, count);
      }
      return next;
    });
  }

  return (
    <fieldset className="sm:col-span-2 lg:col-span-3">
      <legend className="text-sm text-muted">覺醒（點圖示加 1，點數字減 1。最多 8 個，算覺醒欄）</legend>
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(awakeningLabels).map(([code, label]) => {
          const awakening = Number(code);
          const count = counts.get(awakening) ?? 0;
          return (
            <span key={code} className="relative">
              <button
                type="button"
                aria-label={count > 0 ? `${label} ${count} 個，再點加 1` : `${label}，點一下加 1`}
                title={count > 0 ? `${label} ×${count}` : label}
                className={`rounded border p-0.5 ${count > 0 ? "border-accent bg-background" : "border-line"}`}
                onClick={() => change(awakening, 1)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  change(awakening, -1);
                }}
              >
                <AwakeningIcon code={awakening} compact />
              </button>
              {count > 0 ? (
                <button
                  type="button"
                  aria-label={`${label} 減 1`}
                  title="減 1"
                  className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 text-white"
                  onClick={() => change(awakening, -1)}
                >
                  {count}
                </button>
              ) : null}
            </span>
          );
        })}
      </div>
      {[...counts].map(([code, count]) => (
        <input
          key={code}
          type="hidden"
          name="awk"
          value={count > 1 ? `${code}x${count}` : String(code)}
        />
      ))}
    </fieldset>
  );
}
