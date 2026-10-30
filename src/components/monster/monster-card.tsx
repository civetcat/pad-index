import Link from "next/link";
import { labelOrUnknown, typeLabels } from "@/lib/labels";
import type { MonsterBrief } from "@/lib/queries/monsters";
import { AttributePips } from "./attribute-pips";
import { MonsterPortrait } from "./monster-portrait";

export function MonsterCard({ monster }: { monster: MonsterBrief }) {
  return (
    <Link
      href={`/monster/${monster.monsterId}`}
      className="flex gap-3 rounded-lg border border-line bg-card p-3 hover:border-accent"
    >
      <MonsterPortrait
        monsterId={monster.monsterId}
        attributes={[monster.attributePrimary, monster.attributeSecondary, monster.attributeTertiary]}
      />
      <span className="min-w-0 flex-1">
        <span lang="ja" className="block truncate font-medium">{monster.name}</span>
        {monster.nameCht && monster.nameCht !== monster.name ? (
          <span className="block truncate text-sm text-muted">{monster.nameCht}</span>
        ) : null}
        <span className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <AttributePips
            attributes={[monster.attributePrimary, monster.attributeSecondary, monster.attributeTertiary]}
          />
          <span className="text-muted">★{monster.rarity ?? "未知"}</span>
          <span className="text-muted">
            {monster.types.map((type) => labelOrUnknown(typeLabels, type, "類型")).join(" / ") || "類型未知"}
          </span>
        </span>
      </span>
    </Link>
  );
}
