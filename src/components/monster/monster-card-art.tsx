"use client";

import { useState } from "react";
import { cardArtUrl } from "@/lib/portraits";

export function MonsterCardArt({
  monsterId,
  name,
}: {
  monsterId: number;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const url = cardArtUrl(monsterId);
  if (!url || failed) {
    return null;
  }
  return (
    <a
      className={visible ? "block w-full max-w-full shrink-0 sm:max-w-[320px]" : "hidden"}
      href={url}
      rel="noreferrer"
      target="_blank"
      title="本體圖"
    >
      <img
        alt={name}
        className="h-auto w-full rounded bg-background"
        height={400}
        src={url}
        width={540}
        onError={() => setFailed(true)}
        onLoad={() => setVisible(true)}
      />
    </a>
  );
}
