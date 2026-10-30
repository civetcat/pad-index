"use client";

import { useState } from "react";
import { cardFramePlacement, cardFrameSheet, portraitPlacement } from "@/lib/portraits";

export function MonsterPortrait({
  monsterId,
  size = 56,
  attributes = [],
}: {
  monsterId: number;
  size?: number;
  attributes?: Array<number | null | undefined>;
}) {
  const [failed, setFailed] = useState(false);
  const placement = portraitPlacement(monsterId);
  if (!placement || failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded bg-background font-mono text-xs text-muted"
        style={{ width: size, height: size }}
      >
        #{monsterId}
      </span>
    );
  }
  const scale = size / 100;
  const frames = attributes
    .slice(0, 3)
    .map((attribute, slot) => cardFramePlacement(attribute, slot))
    .filter((frame) => frame !== null);
  return (
    <span
      className="relative shrink-0 overflow-hidden bg-background"
      style={{ width: size, height: size }}
    >
      <img
        alt=""
        className="absolute max-w-none"
        src={placement.url}
        style={{
          width: 1024 * scale,
          height: 1024 * scale,
          left: -placement.x * 102 * scale,
          top: -placement.y * 102 * scale,
        }}
        onError={() => setFailed(true)}
      />
      {frames.map((frame) => (
        <img
          key={`${frame.column}-${frame.row}`}
          alt=""
          className="pointer-events-none absolute max-w-none"
          src={cardFrameSheet}
          style={{
            width: 712 * scale,
            height: 412 * scale,
            left: -frame.column * 102 * scale,
            top: -frame.row * 104 * scale,
          }}
        />
      ))}
    </span>
  );
}
