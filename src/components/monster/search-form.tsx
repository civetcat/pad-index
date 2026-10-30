import Link from "next/link";
import { AwakeningFilter } from "@/components/monster/awakening-filter";
import { attributeLabels, typeLabels } from "@/lib/labels";
import { effectCategories, effectCategoryLabels } from "@/lib/skills/classify";
import type { MonsterFilters } from "@/lib/queries/filters";

export function SearchForm({ filters }: { filters: MonsterFilters }) {
  return (
    <form className="grid gap-3 rounded-lg border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-3" method="get">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">名稱或 ID</span>
        <input
          className="rounded border border-line bg-background px-3 py-2"
          name="q"
          defaultValue={filters.q}
          placeholder="例如 1 或 Tyrra"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">屬性</span>
        <select className="rounded border border-line bg-background px-3 py-2" name="attr" defaultValue={filters.attribute ?? ""}>
          <option value="">全部</option>
          {Object.entries(attributeLabels).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">稀有度</span>
        <input
          className="rounded border border-line bg-background px-3 py-2"
          name="rarity"
          inputMode="numeric"
          defaultValue={filters.rarity ?? ""}
          placeholder="數字"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">類型</span>
        <select className="rounded border border-line bg-background px-3 py-2" name="type" defaultValue={filters.type ?? ""}>
          <option value="">全部</option>
          {Object.entries(typeLabels).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">技能文字</span>
        <input
          className="rounded border border-line bg-background px-3 py-2"
          name="skill"
          defaultValue={filters.skill}
          placeholder="貼上一段技能原文或中文對照"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">技能欄</span>
        <select className="rounded border border-line bg-background px-3 py-2" name="slot" defaultValue={filters.slot ?? ""}>
          <option value="">隊長和隊員</option>
          <option value="leader">隊長技能</option>
          <option value="active">隊員技能</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">技能效果</span>
        <select className="rounded border border-line bg-background px-3 py-2" name="effect" defaultValue={filters.effect ?? ""}>
          <option value="">全部</option>
          {effectCategories.map((category) => (
            <option key={category} value={category}>{effectCategoryLabels[category]}</option>
          ))}
        </select>
      </label>
      <AwakeningFilter selected={filters.awakenings} />
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <button className="rounded bg-accent px-4 py-2 text-sm font-medium text-white" type="submit">
          搜尋
        </button>
        <Link className="rounded border border-line px-4 py-2 text-sm" href="/">
          清除
        </Link>
      </div>
    </form>
  );
}
